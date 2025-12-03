
export interface FileSystemState {
  'duenos.csv': string;
  'perros.csv': string;
}

export interface BTreeNode {
  isLeaf: boolean;
  keys: string[];
  children?: BTreeNode[]; // For internal nodes
  values?: number[][];    // For leaf nodes: list of record IDs per key
  next?: BTreeNode | null; // For leaf nodes linked list
}

export interface BTreeState {
  root: BTreeNode;
  order: number; // Max children per node
}

export interface StatementResult {
  command: string;
  success: boolean;
  message: string;
  id_asignado?: number;
}

export interface QueryResult {
  results: StatementResult[];
  updatedFiles?: FileSystemState;
  updatedTree?: BTreeState;
}

export interface SearchStep {
  message: string;
  nodeType: 'root' | 'internal' | 'leaf';
  details?: string;
}

export interface SearchResult {
  results: Record<string, string>[]; // Array of row objects
  trace: SearchStep[];
}

export enum TableName {
  DUENOS = 'duenos',
  PERROS = 'perros',
  OWNERS = 'owners', // Alias
  DOGS = 'dogs'     // Alias
}
