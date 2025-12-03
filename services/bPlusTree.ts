
import { BTreeNode, BTreeState, SearchStep } from '../types';

/**
 * A simplified in-memory B+ Tree implementation for educational visualization.
 * It handles insertion and simple node splitting to demonstrate the concept.
 */
export class BPlusTree {
  root: BTreeNode;
  order: number;

  constructor(order: number = 3) {
    this.order = order;
    this.root = {
      isLeaf: true,
      keys: [],
      values: []
    };
  }

  /**
   * Search for a key and return the Record IDs + Execution Trace
   */
  search(key: string): { ids: number[], trace: SearchStep[] } {
    const trace: SearchStep[] = [];
    let current = this.root;
    
    trace.push({
      message: `Accediendo a la Raíz del Árbol B+`,
      nodeType: 'root',
      details: `Claves en raíz: [${current.keys.join(', ')}]`
    });

    // Traverse down to leaf
    while (!current.isLeaf) {
      let i = 0;
      while (i < current.keys.length && key >= current.keys[i]) {
        i++;
      }
      
      const rangeText = i === 0 ? `< ${current.keys[0]}` 
        : i === current.keys.length ? `>= ${current.keys[i-1]}`
        : `${current.keys[i-1]} <= key < ${current.keys[i]}`;

      trace.push({
        message: `Nodo Interno: Buscando '${key}'`,
        nodeType: 'internal',
        details: `Siguiendo puntero ${i} (Rango: ${rangeText})`
      });

      if (current.children) {
        current = current.children[i];
      } else {
        break; // Should not happen in valid tree
      }
    }

    // Search in leaf
    trace.push({
      message: `Hoja Alcanzada: Buscando coincidencia exacta`,
      nodeType: 'leaf',
      details: `Claves en hoja: [${current.keys.join(', ')}]`
    });

    const index = current.keys.indexOf(key);
    if (index !== -1 && current.values) {
      const ids = current.values[index];
      trace.push({
        message: `✅ Coincidencia encontrada para '${key}'`,
        nodeType: 'leaf',
        details: `IDs de Registro recuperados: [${ids.join(', ')}]`
      });
      return { ids, trace };
    }

    trace.push({
      message: `❌ No se encontraron coincidencias para '${key}'`,
      nodeType: 'leaf'
    });
    
    return { ids: [], trace };
  }

  /**
   * Insert a key (Raza) and a value (Record ID) into the tree.
   */
  insert(key: string, value: number) {
    // 1. Find the leaf node where the key belongs
    const leaf = this.findLeaf(this.root, key);

    // 2. Insert into leaf
    this.insertIntoLeaf(leaf, key, value);

    // 3. (Simplified) If root is too full, we just split it for visual demonstration
    // In a real production B+ Tree, this would propagate up recursively.
    if (this.root.keys.length >= this.order) {
      const newRoot: BTreeNode = {
        isLeaf: false,
        keys: [this.root.keys[Math.floor(this.root.keys.length / 2)]],
        children: []
      };
      
      // Split the old root into two
      const splitIndex = Math.floor(this.root.keys.length / 2);
      
      const leftNode: BTreeNode = {
        isLeaf: this.root.isLeaf,
        keys: this.root.keys.slice(0, splitIndex),
        values: this.root.values ? this.root.values.slice(0, splitIndex) : undefined,
        children: this.root.children ? this.root.children.slice(0, splitIndex + 1) : undefined
      };

      const rightNode: BTreeNode = {
        isLeaf: this.root.isLeaf,
        keys: this.root.keys.slice(splitIndex), // Keep split key in leaf for B+ Tree
        values: this.root.values ? this.root.values.slice(splitIndex) : undefined,
        children: this.root.children ? this.root.children.slice(splitIndex + 1) : undefined
      };
      
      newRoot.children = [leftNode, rightNode];
      this.root = newRoot;
    }
  }

  private findLeaf(node: BTreeNode, key: string): BTreeNode {
    if (node.isLeaf) {
      return node;
    }

    // Simple linear search for child index
    let i = 0;
    while (i < node.keys.length && key >= node.keys[i]) {
      i++;
    }
    
    // Safety check
    if (!node.children) return node;
    return this.findLeaf(node.children[i], key);
  }

  private insertIntoLeaf(leaf: BTreeNode, key: string, value: number) {
    const existingIndex = leaf.keys.indexOf(key);

    if (existingIndex !== -1) {
      // Key exists, append ID to list
      if (leaf.values && leaf.values[existingIndex]) {
        leaf.values[existingIndex].push(value);
      }
    } else {
      // New key, insert in order
      let i = 0;
      while (i < leaf.keys.length && leaf.keys[i] < key) {
        i++;
      }
      
      leaf.keys.splice(i, 0, key);
      if (leaf.values) {
        leaf.values.splice(i, 0, [value]);
      }
    }
  }

  /**
   * Rebuilds the tree from CSV content.
   * Assumes Perros format: id_perro,raza,nombre_perro,id_dueno
   */
  static fromCSV(csvContent: string): BTreeState {
    const tree = new BPlusTree(4); // Order 4 for better visualization
    const lines = csvContent.trim().split('\n');
    
    // Skip header (index 0)
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const parts = line.split(',');
      if (parts.length >= 2) {
        const id = parseInt(parts[0]);
        const raza = parts[1].trim(); // Indexing by Raza
        
        if (!isNaN(id) && raza) {
          tree.insert(raza, id);
        }
      }
    }

    return {
      root: tree.root,
      order: tree.order
    };
  }
}
