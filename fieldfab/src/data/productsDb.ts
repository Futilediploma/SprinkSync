// IndexedDB for Victaulic Products
import { openDB } from 'idb';
import type { DBSchema, IDBPDatabase } from 'idb';

export type Product = {
  id?: number;
  product_name: string;
  product_url: string;
  short_description: string;
  manufacturer?: string; // Manufacturer name (extracted from CSV filename)
  // Searchable fields
  search_text: string; // Lowercase version for searching
};

interface ProductsDB extends DBSchema {
  products: {
    key: number;
    value: Product;
    indexes: {
      'by-name': string;
      'by-search': string;
      'by-manufacturer': string; // Index for filtering by manufacturer
    };
  };
  metadata: {
    key: string;
    value: {
      key: string;
      value: any;
    };
  };
}

let dbInstance: IDBPDatabase<ProductsDB> | null = null;

/**
 * Initialize the IndexedDB database
 */
export async function initProductsDatabase(): Promise<IDBPDatabase<ProductsDB>> {
  if (dbInstance) {
    return dbInstance;
  }

  dbInstance = await openDB<ProductsDB>('victaulic-products', 2, {
    upgrade(db, oldVersion, newVersion, transaction) {
      // Create products store
      if (!db.objectStoreNames.contains('products')) {
        const productStore = db.createObjectStore('products', {
          keyPath: 'id',
          autoIncrement: true,
        });

        // Create indexes for searching
        productStore.createIndex('by-name', 'product_name', { unique: false });
        productStore.createIndex('by-search', 'search_text', { unique: false });
        productStore.createIndex('by-manufacturer', 'manufacturer', { unique: false });
      } else if (oldVersion < 2) {
        // Upgrade existing database to version 2: add manufacturer index
        // Use the upgrade transaction that's already running
        const productStore = transaction.objectStore('products');
        if (!productStore.indexNames.contains('by-manufacturer')) {
          productStore.createIndex('by-manufacturer', 'manufacturer', { unique: false });
        }
      }

      // Create metadata store
      if (!db.objectStoreNames.contains('metadata')) {
        db.createObjectStore('metadata', { keyPath: 'key' });
      }
    },
  });

  return dbInstance;
}

/**
 * Check if database has been populated
 */
export async function isDatabasePopulated(): Promise<boolean> {
  const db = await initProductsDatabase();
  const metadata = await db.get('metadata', 'populated');
  return metadata?.value === true;
}

/**
 * Mark database as populated
 */
async function markDatabasePopulated(db: IDBPDatabase<ProductsDB>) {
  await db.put('metadata', { key: 'populated', value: true });
}

/**
 * Extract manufacturer name from CSV file path
 * Example: '/fieldfab/loosematerial/victaulic_fire_protection_products.csv' -> 'Victaulic'
 */
function extractManufacturerFromPath(csvPath: string): string {
  const filename = csvPath.split('/').pop() || '';
  const manufacturer = filename.split('_')[0];
  return manufacturer.charAt(0).toUpperCase() + manufacturer.slice(1);
}

/**
 * Parse CSV text into Product objects
 */
function parseCSV(csvText: string, csvPath: string): Product[] {
  const lines = csvText.split('\n');
  if (lines.length === 0) return [];

  const headers = lines[0].split(',').map(h => h.trim());
  const manufacturer = extractManufacturerFromPath(csvPath);
  const products: Product[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = parseCSVLine(line);
    if (values.length === headers.length) {
      const product: any = {};
      headers.forEach((header, idx) => {
        product[header] = values[idx];
      });

      // Add manufacturer field
      product.manufacturer = manufacturer;

      // Add search text (include manufacturer for searchability)
      product.search_text = `${manufacturer} ${product.product_name} ${product.short_description}`.toLowerCase();

      products.push(product as Product);
    }
  }

  return products;
}

/**
 * Parse a single CSV line, handling quoted values
 */
function parseCSVLine(line: string): string[] {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  values.push(current.trim());
  return values;
}

/**
 * Load multiple CSV files and populate database
 */
export async function populateDatabaseFromCSV(): Promise<void> {
  const db = await initProductsDatabase();

  // Check if already populated
  const isPopulated = await isDatabasePopulated();
  if (isPopulated) {
    console.log('Database already populated');
    return;
  }

  console.log('Loading products from multiple CSV sources...');

  // Define CSV sources to load
  const CSV_SOURCES = [
    '/fieldfab/loosematerial/victaulic_fire_protection_products.csv',
    '/fieldfab/loosematerial/anvil_threaded_fittings.csv',
    '/fieldfab/loosematerial/viking_fire_protection_products.csv',
    '/fieldfab/loosematerial/reliable_fire_protection_products.csv',
    '/fieldfab/loosematerial/tyco_fire_protection_products.csv',
  ];

  let allProducts: Product[] = [];

  // Load each CSV source
  for (const csvPath of CSV_SOURCES) {
    try {
      console.log(`Loading ${csvPath}...`);
      const response = await fetch(csvPath);

      if (!response.ok) {
        console.warn(`Failed to load ${csvPath}: ${response.statusText}`);
        continue; // Continue with other sources even if one fails
      }

      const csvText = await response.text();
      const products = parseCSV(csvText, csvPath);
      allProducts = [...allProducts, ...products];

      console.log(`Loaded ${products.length} products from ${csvPath}`);
    } catch (error) {
      console.error(`Error loading ${csvPath}:`, error);
      // Continue with other sources even if one fails
    }
  }

  if (allProducts.length === 0) {
    throw new Error('No products could be loaded from any CSV source');
  }

  console.log(`Total ${allProducts.length} products parsed, inserting into database...`);

  try {
    // Use a transaction for better performance
    const tx = db.transaction('products', 'readwrite');
    const store = tx.objectStore('products');

    // Insert all products
    await Promise.all(allProducts.map(product => store.add(product)));
    await tx.done;

    // Mark as populated
    await markDatabasePopulated(db);

    console.log(`Database populated with ${allProducts.length} products from ${CSV_SOURCES.length} sources`);
  } catch (error) {
    console.error('Error inserting products into database:', error);
    throw error;
  }
}

/**
 * Search products by query string
 */
export async function searchProducts(query: string, limit: number = 10): Promise<Product[]> {
  if (!query || query.trim().length < 2) {
    return [];
  }

  const db = await initProductsDatabase();
  const queryLower = query.toLowerCase();
  const queryWords = queryLower.split(/\s+/).filter(w => w.length > 0);

  // Get all products and score them
  const allProducts = await db.getAll('products');

  const scored = allProducts.map(product => {
    const searchText = product.search_text;
    const name = product.product_name.toLowerCase();
    let score = 0;

    // Exact match on name
    if (name === queryLower) {
      score = 1000;
    }
    // Name starts with query
    else if (name.startsWith(queryLower)) {
      score = 500;
    }
    // Name contains query
    else if (name.includes(queryLower)) {
      score = 250;
    }
    // Search text contains query
    else if (searchText.includes(queryLower)) {
      score = 100;
    }
    // Match individual words
    else {
      let matchingWords = 0;
      for (const word of queryWords) {
        if (searchText.includes(word)) {
          matchingWords++;
        }
      }
      if (matchingWords > 0) {
        score = matchingWords * 50;
      }
    }

    return { product, score };
  });

  // Filter, sort by score, and limit results
  const filteredAndSorted = scored
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score);

  // Deduplicate by product name (keep highest scoring one)
  const seen = new Set<string>();
  const deduped = filteredAndSorted.filter(s => {
    const key = s.product.product_name.toLowerCase();
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });

  return deduped
    .slice(0, limit)
    .map(s => s.product);
}

/**
 * Get product by ID
 */
export async function getProductById(id: number): Promise<Product | undefined> {
  const db = await initProductsDatabase();
  return db.get('products', id);
}

/**
 * Get all products (use with caution - could be large)
 */
export async function getAllProducts(): Promise<Product[]> {
  const db = await initProductsDatabase();
  return db.getAll('products');
}

/**
 * Get product count
 */
export async function getProductCount(): Promise<number> {
  const db = await initProductsDatabase();
  return db.count('products');
}

/**
 * Clear all products (for re-import)
 */
export async function clearProducts(): Promise<void> {
  const db = await initProductsDatabase();
  const tx = db.transaction(['products', 'metadata'], 'readwrite');
  await tx.objectStore('products').clear();
  await tx.objectStore('metadata').delete('populated');
  await tx.done;
  console.log('Products database cleared - refresh page to reload');
}

/**
 * Get list of unique manufacturers from database
 */
export async function getAllManufacturers(): Promise<string[]> {
  const db = await initProductsDatabase();
  const allProducts = await db.getAll('products');
  const manufacturers = new Set<string>();

  allProducts.forEach(product => {
    if (product.manufacturer) {
      manufacturers.add(product.manufacturer);
    }
  });

  return Array.from(manufacturers).sort();
}

// Expose clearProducts globally for debugging
if (typeof window !== 'undefined') {
  (window as any).clearProductsDB = clearProducts;
}
