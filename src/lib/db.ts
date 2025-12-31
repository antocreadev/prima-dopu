import Database from "better-sqlite3";
import { join } from "path";
import { mkdirSync } from "fs";

// Utiliser process.cwd() pour pointer vers la racine du projet
const dbPath = join(process.cwd(), "data/primadopu.db");

// Créer le dossier data s'il n'existe pas
try {
  mkdirSync(join(process.cwd(), "data"), { recursive: true });
} catch {}

const db = new Database(dbPath);

// Activer les foreign keys
db.pragma("foreign_keys = ON");

// Créer les tables
db.exec(`
  -- Table des dossiers pour organiser les références
  CREATE TABLE IF NOT EXISTS folders (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    color TEXT DEFAULT '#6366f1',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Table des références (images de matériaux/textures)
  CREATE TABLE IF NOT EXISTS material_refs (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT,
    image_path TEXT NOT NULL,
    folder_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (folder_id) REFERENCES folders(id) ON DELETE SET NULL
  );

  -- Table des générations (avant/après)
  CREATE TABLE IF NOT EXISTS generations (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    original_image_path TEXT NOT NULL,
    generated_image_path TEXT,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Table des instructions (pour chaque génération)
  CREATE TABLE IF NOT EXISTS instructions (
    id TEXT PRIMARY KEY,
    generation_id TEXT NOT NULL,
    location TEXT NOT NULL,
    reference_id TEXT NOT NULL,
    FOREIGN KEY (generation_id) REFERENCES generations(id) ON DELETE CASCADE,
    FOREIGN KEY (reference_id) REFERENCES material_refs(id)
  );

  -- Index pour les recherches par user_id
  CREATE INDEX IF NOT EXISTS idx_material_refs_user ON material_refs(user_id);
  CREATE INDEX IF NOT EXISTS idx_generations_user ON generations(user_id);
  CREATE INDEX IF NOT EXISTS idx_folders_user ON folders(user_id);
`);

// Migration: ajouter folder_id si la colonne n'existe pas
try {
  db.exec(`ALTER TABLE material_refs ADD COLUMN folder_id TEXT REFERENCES folders(id) ON DELETE SET NULL`);
} catch {
  // La colonne existe déjà
}

export default db;

// Types
export interface Folder {
  id: string;
  user_id: string;
  name: string;
  color: string;
  created_at: string;
}

export interface Reference {
  id: string;
  user_id: string;
  name: string | null;
  image_path: string;
  folder_id: string | null;
  created_at: string;
}

export interface Generation {
  id: string;
  user_id: string;
  original_image_path: string;
  generated_image_path: string | null;
  status: "pending" | "processing" | "completed" | "failed";
  created_at: string;
}

export interface Instruction {
  id: string;
  generation_id: string;
  location: string;
  reference_id: string;
}

// Fonctions pour les dossiers
export function createFolder(userId: string, name: string, color?: string): Folder {
  const id = crypto.randomUUID();
  const stmt = db.prepare(`
    INSERT INTO folders (id, user_id, name, color) VALUES (?, ?, ?, ?)
  `);
  stmt.run(id, userId, name, color || '#6366f1');
  return getFolder(id)!;
}

export function getFolder(id: string): Folder | undefined {
  const stmt = db.prepare("SELECT * FROM folders WHERE id = ?");
  return stmt.get(id) as Folder | undefined;
}

export function getUserFolders(userId: string): Folder[] {
  const stmt = db.prepare(
    "SELECT * FROM folders WHERE user_id = ? ORDER BY name ASC"
  );
  return stmt.all(userId) as Folder[];
}

export function updateFolder(id: string, userId: string, name: string, color?: string): boolean {
  const stmt = db.prepare(
    "UPDATE folders SET name = ?, color = COALESCE(?, color) WHERE id = ? AND user_id = ?"
  );
  const result = stmt.run(name, color || null, id, userId);
  return result.changes > 0;
}

export function deleteFolder(id: string, userId: string): boolean {
  // Les références seront automatiquement mises à NULL grâce à ON DELETE SET NULL
  const stmt = db.prepare("DELETE FROM folders WHERE id = ? AND user_id = ?");
  const result = stmt.run(id, userId);
  return result.changes > 0;
}

// Fonctions pour les références
export function createReference(
  userId: string,
  imagePath: string,
  name?: string,
  folderId?: string
): Reference {
  const id = crypto.randomUUID();
  const stmt = db.prepare(`
    INSERT INTO material_refs (id, user_id, name, image_path, folder_id) VALUES (?, ?, ?, ?, ?)
  `);
  stmt.run(id, userId, name || null, imagePath, folderId || null);
  return getReference(id)!;
}

export function getReference(id: string): Reference | undefined {
  const stmt = db.prepare("SELECT * FROM material_refs WHERE id = ?");
  return stmt.get(id) as Reference | undefined;
}

export function getUserReferences(userId: string, folderId?: string | null): Reference[] {
  if (folderId === undefined) {
    // Toutes les références
    const stmt = db.prepare(
      "SELECT * FROM material_refs WHERE user_id = ? ORDER BY created_at DESC"
    );
    return stmt.all(userId) as Reference[];
  } else if (folderId === null) {
    // Références sans dossier
    const stmt = db.prepare(
      "SELECT * FROM material_refs WHERE user_id = ? AND folder_id IS NULL ORDER BY created_at DESC"
    );
    return stmt.all(userId) as Reference[];
  } else {
    // Références d'un dossier spécifique
    const stmt = db.prepare(
      "SELECT * FROM material_refs WHERE user_id = ? AND folder_id = ? ORDER BY created_at DESC"
    );
    return stmt.all(userId, folderId) as Reference[];
  }
}

export function moveReferenceToFolder(id: string, userId: string, folderId: string | null): boolean {
  const stmt = db.prepare(
    "UPDATE material_refs SET folder_id = ? WHERE id = ? AND user_id = ?"
  );
  const result = stmt.run(folderId, id, userId);
  return result.changes > 0;
}

export function deleteReference(id: string, userId: string): boolean {
  // D'abord supprimer les instructions qui utilisent cette référence
  const deleteInstructions = db.prepare(
    "DELETE FROM instructions WHERE reference_id = ?"
  );
  deleteInstructions.run(id);

  // Ensuite supprimer la référence
  const stmt = db.prepare(
    "DELETE FROM material_refs WHERE id = ? AND user_id = ?"
  );
  const result = stmt.run(id, userId);
  return result.changes > 0;
}

// Fonctions pour les générations
export function createGeneration(
  userId: string,
  originalImagePath: string
): Generation {
  const id = crypto.randomUUID();
  const stmt = db.prepare(`
    INSERT INTO generations (id, user_id, original_image_path) VALUES (?, ?, ?)
  `);
  stmt.run(id, userId, originalImagePath);
  return getGeneration(id)!;
}

export function getGeneration(id: string): Generation | undefined {
  const stmt = db.prepare("SELECT * FROM generations WHERE id = ?");
  return stmt.get(id) as Generation | undefined;
}

export function getUserGenerations(userId: string): Generation[] {
  const stmt = db.prepare(
    "SELECT * FROM generations WHERE user_id = ? ORDER BY created_at DESC"
  );
  return stmt.all(userId) as Generation[];
}

export function updateGeneration(
  id: string,
  updates: Partial<Pick<Generation, "generated_image_path" | "status">>
): void {
  const sets: string[] = [];
  const values: any[] = [];

  if (updates.generated_image_path !== undefined) {
    sets.push("generated_image_path = ?");
    values.push(updates.generated_image_path);
  }
  if (updates.status !== undefined) {
    sets.push("status = ?");
    values.push(updates.status);
  }

  if (sets.length > 0) {
    values.push(id);
    const stmt = db.prepare(
      `UPDATE generations SET ${sets.join(", ")} WHERE id = ?`
    );
    stmt.run(...values);
  }
}

export function deleteGeneration(id: string, userId: string): boolean {
  const stmt = db.prepare(
    "DELETE FROM generations WHERE id = ? AND user_id = ?"
  );
  const result = stmt.run(id, userId);
  return result.changes > 0;
}

// Fonctions pour les instructions
export function createInstruction(
  generationId: string,
  location: string,
  referenceId: string
): Instruction {
  const id = crypto.randomUUID();
  const stmt = db.prepare(`
    INSERT INTO instructions (id, generation_id, location, reference_id) VALUES (?, ?, ?, ?)
  `);
  stmt.run(id, generationId, location, referenceId);
  return {
    id,
    generation_id: generationId,
    location,
    reference_id: referenceId,
  };
}

export function getGenerationInstructions(
  generationId: string
): (Instruction & { reference: Reference })[] {
  const stmt = db.prepare(`
    SELECT i.*, r.id as ref_id, r.user_id as ref_user_id, r.name as ref_name, 
           r.image_path as ref_image_path, r.folder_id as ref_folder_id, r.created_at as ref_created_at
    FROM instructions i
    JOIN material_refs r ON i.reference_id = r.id
    WHERE i.generation_id = ?
  `);
  const rows = stmt.all(generationId) as any[];
  return rows.map((row) => ({
    id: row.id,
    generation_id: row.generation_id,
    location: row.location,
    reference_id: row.reference_id,
    reference: {
      id: row.ref_id,
      user_id: row.ref_user_id,
      name: row.ref_name,
      image_path: row.ref_image_path,
      folder_id: row.ref_folder_id,
      created_at: row.ref_created_at,
    },
  }));
}

export function deleteInstruction(id: string): boolean {
  const stmt = db.prepare("DELETE FROM instructions WHERE id = ?");
  const result = stmt.run(id);
  return result.changes > 0;
}
