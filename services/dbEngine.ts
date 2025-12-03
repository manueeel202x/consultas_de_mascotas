
import { FileSystemState, QueryResult, BTreeState, SearchResult, StatementResult } from '../types';
import { BPlusTree } from './bPlusTree';

// Initial CSV Data simulation
export const INITIAL_FILES: FileSystemState = {
  'duenos.csv': `id_dueno,nombre_dueno
1,Juan Perez
2,Maria Garcia
3,Carlos Lopez`,
  'perros.csv': `id_perro,raza,nombre_perro,id_dueno
101,Labrador,Buddy,1
102,Beagle,Luna,2
103,Bulldog,Rocky,1`
};

/**
 * Helper to parse CSV line keeping types simple
 */
const parseCSVLine = (line: string) => line.split(',').map(s => s.trim());

/**
 * Helper to parse values from SQL string like "('A', 1), ('B', 2)"
 */
const parseValuesTuples = (valuesStr: string): string[][] => {
  const tuples: string[][] = [];
  // Regex to match content inside parentheses: ( ... )
  // We use a simplified regex that assumes values don't contain unescaped closing parentheses
  const regex = /\(([^)]+)\)/g;
  let match;
  while ((match = regex.exec(valuesStr)) !== null) {
      const tupleContent = match[1];
      // Split by comma, handling quotes roughly
      const values = tupleContent.split(',').map(val => {
          let cleaned = val.trim();
          if ((cleaned.startsWith("'") && cleaned.endsWith("'")) || 
              (cleaned.startsWith('"') && cleaned.endsWith('"'))) {
              cleaned = cleaned.slice(1, -1);
          }
          return cleaned;
      });
      tuples.push(values);
  }
  return tuples;
};

/**
 * Executes a single SQL command (which might contain bulk inserts) against the provided state.
 * Returns the results (list) and the potentially modified state.
 */
const executeCommand = (
    cmd: string, 
    currentFiles: FileSystemState,
    currentTreeState?: BTreeState
): { results: StatementResult[], newFiles: FileSystemState, newTree: BTreeState | undefined } => {
    
    const trimmedCommand = cmd.trim();

    // 1. Validation: Must start with INSERT INTO
    if (!trimmedCommand.toUpperCase().startsWith('INSERT INTO')) {
        return {
            results: [{
                command: cmd,
                success: false,
                message: "Error de Sintaxis: El comando debe comenzar con 'INSERT INTO'."
            }],
            newFiles: currentFiles,
            newTree: currentTreeState
        };
    }

    // 2. Parsing Table Name and Values section
    // Regex matches: INSERT INTO TableName ... VALUES ...
    const regex = /INSERT\s+INTO\s+([a-zA-Z0-9_]+)\s+(?:.*?)VALUES\s*(.*)/is;
    const match = trimmedCommand.match(regex);

    if (!match) {
        return {
            results: [{
                command: cmd,
                success: false,
                message: "Error de Formato: Use INSERT INTO Tabla VALUES (...);"
            }],
            newFiles: currentFiles,
            newTree: currentTreeState
        };
    }

    const rawTableName = match[1].toLowerCase();
    const rawValuesSection = match[2];

    // Determine target file
    let targetFile: keyof FileSystemState;
    let isPerrosTable = false;

    if (rawTableName === 'duenos' || rawTableName === 'dueños' || rawTableName === 'owners') {
        targetFile = 'duenos.csv';
    } else if (rawTableName === 'perros' || rawTableName === 'dogs') {
        targetFile = 'perros.csv';
        isPerrosTable = true;
    } else {
        return {
            results: [{
                command: cmd,
                success: false,
                message: `Error: La tabla '${match[1]}' no existe.`
            }],
            newFiles: currentFiles,
            newTree: currentTreeState
        };
    }

    // Parse all tuples from the values section for Bulk Insert
    const valueSets = parseValuesTuples(rawValuesSection);
    
    if (valueSets.length === 0) {
        return {
             results: [{
                command: cmd,
                success: false,
                message: "Error de Sintaxis: No se encontraron valores válidos en paréntesis (val1, val2)."
            }],
            newFiles: currentFiles,
            newTree: currentTreeState
        };
    }

    const results: StatementResult[] = [];
    let workingFiles = { ...currentFiles };
    let workingTree = currentTreeState;

    // Iterate over each tuple (Bulk Insert Loop)
    for (const values of valueSets) {
        const currentContent = workingFiles[targetFile];
        const lines = currentContent.trim().split('\n');
        const headers = lines[0].split(',');
        
        let assignedId: number | undefined;
        let errorMsg: string | null = null;

        // LOGIC FOR PERROS (Auto-increment & Uniqueness)
        if (isPerrosTable) {
            // Expected 3 values: Raza, Nombre, IdDueno (ID is auto-gen)
            if (values.length !== 3) {
                errorMsg = `Error de Esquema: Para 'Perros', ingrese 3 valores: (Raza, Nombre, ID_Dueño).`;
            } else {
                const newRaza = values[0];
                const newNombre = values[1];
                const newIdDueno = values[2];

                // A. Check Uniqueness (Composite Candidate Key: Nombre + IdDueno)
                for (let i = 1; i < lines.length; i++) {
                    const cols = parseCSVLine(lines[i]);
                    // Columns: id, raza, nombre, id_dueno
                    if (cols.length >= 4 && cols[2].toLowerCase() === newNombre.toLowerCase() && cols[3] === newIdDueno) {
                        errorMsg = `Error: Violación de unicidad. '${newNombre}' ya existe para Dueño ID ${newIdDueno}.`;
                        break;
                    }
                }

                if (!errorMsg) {
                    // B. Auto-Increment ID
                    let nextId = 1;
                    if (lines.length > 1) {
                        const lastLine = lines[lines.length - 1];
                        const lastCols = parseCSVLine(lastLine);
                        const lastId = parseInt(lastCols[0]);
                        if (!isNaN(lastId)) {
                            nextId = lastId + 1;
                        }
                    }
                    assignedId = nextId;

                    // Prepend generated ID to values
                    values.unshift(nextId.toString());
                }
            }
        } else {
            // For Owners, standard check
            if (values.length !== headers.length) {
                errorMsg = `Error de Columna: Se esperaban ${headers.length}, se recibieron ${values.length}.`;
            }
        }

        // Execution if no error for this tuple
        if (errorMsg) {
            results.push({
                command: `INSERT (partial)...`, // Simplified log
                success: false,
                message: errorMsg
            });
        } else {
            const newLine = values.join(',');
            const newFileContent = `${currentContent}\n${newLine}`;
            
            workingFiles = {
                ...workingFiles,
                [targetFile]: newFileContent
            };

            // Update Tree if Perros
            if (isPerrosTable) {
                workingTree = BPlusTree.fromCSV(newFileContent);
            }

            results.push({
                command: `INSERT INTO ${rawTableName}...`,
                success: true,
                message: `Inserción exitosa en [${rawTableName}].`,
                id_asignado: assignedId
            });
        }
    }

    return {
        results,
        newFiles: workingFiles,
        newTree: workingTree
    };
};

/**
 * Parses and executes multiple SQL commands separated by semicolons.
 */
export const parseAndExecute = (
  sqlInput: string,
  currentFiles: FileSystemState,
  currentTreeState?: BTreeState
): QueryResult => {
    // Split by semicolon and filter empty commands
    const commands = sqlInput
        .split(';')
        .map(c => c.trim())
        .filter(c => c.length > 0);

    const allResults: StatementResult[] = [];
    let workingFiles = currentFiles;
    let workingTree = currentTreeState;

    // Iterate and execute sequentially
    for (const cmd of commands) {
        const { results, newFiles, newTree } = executeCommand(cmd, workingFiles, workingTree);
        
        allResults.push(...results);
        
        // Update state regardless of partial failures (valid tuples are persisted)
        workingFiles = newFiles;
        workingTree = newTree;
    }

    return {
        results: allResults,
        updatedFiles: workingFiles,
        updatedTree: workingTree
    };
};

export const initializeTree = (files: FileSystemState): BTreeState => {
  return BPlusTree.fromCSV(files['perros.csv']);
};

export const searchDogsByBreed = (
    raza: string, 
    treeState: BTreeState, 
    files: FileSystemState
): SearchResult => {
    const tree = new BPlusTree(treeState.order);
    tree.root = treeState.root;

    const { ids, trace } = tree.search(raza);

    const results: Record<string, string>[] = [];
    
    if (ids.length > 0) {
        const lines = files['perros.csv'].trim().split('\n');
        const headers = lines[0].split(',');
        
        lines.slice(1).forEach(line => {
            const cols = parseCSVLine(line);
            const id = parseInt(cols[0]);
            
            if (ids.includes(id)) {
                const rowObj: Record<string, string> = {};
                headers.forEach((h, i) => {
                    rowObj[h] = cols[i];
                });
                results.push(rowObj);
            }
        });
    }

    return { results, trace };
};
