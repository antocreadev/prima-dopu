# 🔍 AUDIT & PLAN DE REFACTORISATION - gemini.ts

## 📊 ANALYSE DU FICHIER ACTUEL

### Statistiques
- **Lignes de code**: 1627 lignes (trop volumineux, maintenance difficile)
- **Fonctions principales**: 8 fonctions majeures
- **Types/Interfaces**: ~15 types définis

---

## ❌ PROBLÈMES IDENTIFIÉS

### 1. TYPES TROP LIMITÉS - Ne couvre pas tous les métiers

**Problème**: `ElementCategory` ne couvre que 8 catégories très basiques

```typescript
// ACTUEL (8 catégories seulement)
export type ElementCategory =
  | "surface" | "furniture" | "lighting" | "decoration"
  | "equipment" | "outdoor" | "fixture" | "appliance";
```

**Métiers non couverts**:
- 🏗️ **BTP/Construction**: charpente, maçonnerie, isolation, fondations, structure
- 🪟 **Menuiserie/Fermetures**: portes, fenêtres, volets, portails, stores, pergolas
- 🔧 **Plomberie**: tuyauterie, chauffe-eau, robinetterie, sanitaires, évacuation
- ⚡ **Électricité**: tableau électrique, câblage, domotique, interphones
- 🌡️ **Énergie/CVC**: panneaux solaires, pompes à chaleur, climatisation, VMC
- 🏠 **Toiture/Couverture**: tuiles, ardoises, gouttières, zinguerie, cheminées
- 🧱 **Façade/Ravalement**: crépi, enduit, bardage, isolation extérieure
- 🌿 **Paysagisme**: arbres, haies, massifs, pelouse, bassins, allées
- 🏊 **Piscine/Spa**: margelles, liners, terrasses, abris
- 🔐 **Sécurité**: alarmes, caméras, contrôle d'accès, clôtures

---

### 2. PROMPTS PAS ASSEZ STRICTS - Risque de zoom/recadrage

**Problème actuel**: Le prompt ne contient pas de contraintes strictes pour:
- Conserver EXACTEMENT le cadrage original
- Éviter tout zoom avant/arrière
- Maintenir la même résolution/proportions
- Préserver la perspective exacte

**Lignes problématiques**:
- Ligne 1031: Pas de mention explicite "NO ZOOM"
- Le prompt de génération n'insiste pas sur le cadrage identique

---

### 3. AGENT ANALYSTE TROP LIMITÉ

**Problème**: Le prompt d'analyse (ligne 269) ne couvre pas:
- Éléments de construction (charpente, toiture, fondations)
- Installations techniques (plomberie, électricité, chauffage)
- Équipements énergétiques (panneaux solaires, pompes à chaleur)
- Éléments de sécurité (portails, clôtures, alarmes)
- Aménagements extérieurs (piscines, terrasses, allées)

**Catégories manquantes dans le prompt**:
```
CATÉGORIES D'OBJETS À IDENTIFIER:
- Meubles: table, chaise, canapé...  ← Trop limité!
```

---

### 4. AGENT ANALYSE RÉFÉRENCE - Classification binaire insuffisante

**Problème**: La classification "material" vs "object" est trop simple

```typescript
// ACTUEL
type: "material" | "object"
```

**Cas non gérés**:
- Panneau solaire → objet technique/énergie
- Plante/arbre → élément végétal
- Portail → élément de fermeture
- Piscine → aménagement extérieur
- Modèle 3D → doit être rendu photoréaliste
- Image de catalogue → doit être intégrée naturellement

---

### 5. INSERTION D'ÉLÉMENTS PAS RÉALISTE

**Problème**: Quand on insère un objet de référence (meuble de catalogue, modèle 3D):
- Pas d'adaptation de l'éclairage/ombres
- Pas de gestion de la perspective
- Pas de rendu photoréaliste des modèles 3D
- Pas d'intégration naturelle dans la scène

---

### 6. FICHIER MONOLITHIQUE

**Problème**: 1627 lignes = difficile à maintenir

**Blocs identifiés à séparer**:
1. Types & Interfaces (~150 lignes)
2. Configuration & Utils (~100 lignes)
3. Agent Analyste (~200 lignes)
4. Agent Référence (~150 lignes)
5. Agent Planificateur (~400 lignes)
6. Construction Prompt (~200 lignes)
7. Agent Générateur (~150 lignes)
8. Fonctions principales (~300 lignes)

---

## ✅ PLAN DE REFACTORISATION

### Structure des fichiers proposée

```
src/lib/
├── gemini/
│   ├── index.ts              # Export principal (façade)
│   ├── types/
│   │   ├── index.ts          # Export tous les types
│   │   ├── categories.ts     # ElementCategory, ModificationType étendus
│   │   ├── analysis.ts       # ImageAnalysis, ZoneInfo, ObjectInfo
│   │   ├── reference.ts      # ReferenceAnalysis étendu
│   │   └── generation.ts     # GenerationResult, Options
│   ├── agents/
│   │   ├── analyzer.ts       # Agent d'analyse d'image
│   │   ├── reference-analyzer.ts  # Agent d'analyse de référence
│   │   ├── planner.ts        # Agent planificateur
│   │   └── generator.ts      # Agent générateur (Nano Banana)
│   ├── prompts/
│   │   ├── analyzer-prompt.ts    # Prompt d'analyse
│   │   ├── reference-prompt.ts   # Prompt analyse référence
│   │   └── generation-prompt.ts  # Construction du prompt final
│   ├── utils/
│   │   ├── image.ts          # prepareImageForAPI, conversion HEIC
│   │   └── helpers.ts        # sleep, getMimeType
│   └── config.ts             # Configuration API, modèles, retry
├── gemini.ts                 # Fichier rétrocompatible (re-export)
```

---

## 📝 TYPES ÉTENDUS PROPOSÉS

### ElementCategory - 50+ catégories pour tous les métiers

```typescript
export type ElementCategory =
  // ═══════════════════════════════════════════════════════════════
  // SURFACES & REVÊTEMENTS
  // ═══════════════════════════════════════════════════════════════
  | "wall"                // Murs intérieurs
  | "floor"               // Sols
  | "ceiling"             // Plafonds
  | "facade"              // Façades extérieures
  | "roof"                // Toiture
  
  // ═══════════════════════════════════════════════════════════════
  // STRUCTURE & GROS ŒUVRE
  // ═══════════════════════════════════════════════════════════════
  | "foundation"          // Fondations
  | "framework"           // Charpente, ossature
  | "beam"                // Poutres
  | "column"              // Poteaux, colonnes
  | "staircase"           // Escaliers
  | "partition"           // Cloisons
  
  // ═══════════════════════════════════════════════════════════════
  // MENUISERIE & FERMETURES
  // ═══════════════════════════════════════════════════════════════
  | "window"              // Fenêtres
  | "door"                // Portes intérieures
  | "exterior_door"       // Portes extérieures, entrées
  | "garage_door"         // Portes de garage
  | "shutter"             // Volets
  | "blind"               // Stores
  | "gate"                // Portails
  | "fence"               // Clôtures
  | "railing"             // Garde-corps, rambardes
  | "pergola"             // Pergolas, tonnelles
  
  // ═══════════════════════════════════════════════════════════════
  // MOBILIER & AGENCEMENT
  // ═══════════════════════════════════════════════════════════════
  | "furniture"           // Mobilier général
  | "seating"             // Assises (canapés, fauteuils, chaises)
  | "table"               // Tables
  | "storage"             // Rangements (armoires, commodes, étagères)
  | "bed"                 // Literie
  | "desk"                // Bureaux
  | "kitchen_furniture"   // Meubles de cuisine
  | "bathroom_furniture"  // Meubles de salle de bain
  
  // ═══════════════════════════════════════════════════════════════
  // ÉCLAIRAGE
  // ═══════════════════════════════════════════════════════════════
  | "ceiling_light"       // Plafonniers, lustres
  | "pendant_light"       // Suspensions
  | "wall_light"          // Appliques
  | "floor_lamp"          // Lampadaires
  | "table_lamp"          // Lampes de table
  | "spotlight"           // Spots
  | "outdoor_light"       // Éclairage extérieur
  
  // ═══════════════════════════════════════════════════════════════
  // PLOMBERIE & SANITAIRES
  // ═══════════════════════════════════════════════════════════════
  | "sink"                // Éviers, lavabos
  | "toilet"              // WC
  | "bathtub"             // Baignoires
  | "shower"              // Douches
  | "faucet"              // Robinetterie
  | "water_heater"        // Chauffe-eau
  | "radiator"            // Radiateurs
  | "piping"              // Tuyauterie visible
  
  // ═══════════════════════════════════════════════════════════════
  // ÉLECTRICITÉ & DOMOTIQUE
  // ═══════════════════════════════════════════════════════════════
  | "electrical_panel"    // Tableau électrique
  | "outlet"              // Prises électriques
  | "switch"              // Interrupteurs
  | "thermostat"          // Thermostats
  | "intercom"            // Interphones, vidéophones
  | "alarm"               // Systèmes d'alarme
  | "camera"              // Caméras de surveillance
  
  // ═══════════════════════════════════════════════════════════════
  // ÉNERGIE & CLIMATISATION
  // ═══════════════════════════════════════════════════════════════
  | "solar_panel"         // Panneaux solaires
  | "heat_pump"           // Pompes à chaleur
  | "air_conditioning"    // Climatisation
  | "ventilation"         // VMC, ventilation
  | "fireplace"           // Cheminées, poêles
  | "boiler"              // Chaudières
  
  // ═══════════════════════════════════════════════════════════════
  // TOITURE & COUVERTURE
  // ═══════════════════════════════════════════════════════════════
  | "roof_tiles"          // Tuiles
  | "slate"               // Ardoises
  | "gutter"              // Gouttières
  | "chimney"             // Conduits de cheminée
  | "skylight"            // Velux, fenêtres de toit
  | "roof_terrace"        // Toiture terrasse
  
  // ═══════════════════════════════════════════════════════════════
  // AMÉNAGEMENT EXTÉRIEUR & PAYSAGISME
  // ═══════════════════════════════════════════════════════════════
  | "terrace"             // Terrasses
  | "deck"                // Terrasses bois
  | "patio"               // Patios
  | "pathway"             // Allées
  | "driveway"            // Entrées de garage
  | "lawn"                // Pelouses
  | "flower_bed"          // Massifs floraux
  | "hedge"               // Haies
  | "tree"                // Arbres
  | "shrub"               // Arbustes
  | "planter"             // Jardinières
  | "outdoor_furniture"   // Mobilier de jardin
  
  // ═══════════════════════════════════════════════════════════════
  // PISCINE & SPA
  // ═══════════════════════════════════════════════════════════════
  | "pool"                // Piscines
  | "pool_deck"           // Plages de piscine
  | "pool_cover"          // Couvertures, abris piscine
  | "spa"                 // Spas, jacuzzis
  | "pool_house"          // Pool houses
  
  // ═══════════════════════════════════════════════════════════════
  // DÉCORATION
  // ═══════════════════════════════════════════════════════════════
  | "artwork"             // Tableaux, art mural
  | "mirror"              // Miroirs
  | "curtain"             // Rideaux
  | "rug"                 // Tapis
  | "cushion"             // Coussins
  | "vase"                // Vases
  | "sculpture"           // Sculptures
  | "clock"               // Horloges
  | "plant_indoor"        // Plantes d'intérieur
  
  // ═══════════════════════════════════════════════════════════════
  // ÉLECTROMÉNAGER
  // ═══════════════════════════════════════════════════════════════
  | "refrigerator"        // Réfrigérateurs
  | "oven"                // Fours
  | "cooktop"             // Plaques de cuisson
  | "range_hood"          // Hottes
  | "dishwasher"          // Lave-vaisselle
  | "washing_machine"     // Lave-linge
  | "dryer"               // Sèche-linge
  
  // ═══════════════════════════════════════════════════════════════
  // CUISINE
  // ═══════════════════════════════════════════════════════════════
  | "countertop"          // Plans de travail
  | "backsplash"          // Crédences
  | "kitchen_island"      // Îlots de cuisine
  
  // ═══════════════════════════════════════════════════════════════
  // AUTRES
  // ═══════════════════════════════════════════════════════════════
  | "custom";             // Élément personnalisé
```

### ModificationType - Types de modification étendus

```typescript
export type ModificationType =
  // Surfaces
  | "floor" | "wall" | "ceiling" | "facade" | "roof"
  // Structure
  | "framework" | "staircase" | "partition"
  // Menuiserie
  | "window" | "door" | "shutter" | "gate" | "fence" | "railing"
  // Mobilier
  | "furniture" | "seating" | "table" | "storage" | "bed"
  // Éclairage
  | "lighting" | "ceiling_light" | "wall_light" | "outdoor_light"
  // Technique
  | "plumbing" | "electrical" | "heating" | "cooling" | "energy"
  // Toiture
  | "roofing" | "gutter" | "chimney"
  // Extérieur
  | "outdoor" | "terrace" | "garden" | "pool" | "landscape"
  // Décoration
  | "decoration" | "artwork" | "textile" | "plant"
  // Cuisine/SDB
  | "kitchen" | "bathroom" | "appliance"
  // Ajout/Suppression
  | "add_element" | "remove_element"
  // Personnalisé
  | "custom";
```

### ReferenceType - Classification étendue des références

```typescript
export type ReferenceType =
  // Textures & Matériaux
  | "texture"           // Texture pure (carrelage, parquet, peinture)
  | "material_sample"   // Échantillon de matériau
  // Objets & Produits
  | "product_photo"     // Photo de produit (catalogue)
  | "3d_render"         // Rendu 3D / modèle 3D
  | "furniture"         // Meuble
  | "lighting_fixture"  // Luminaire
  | "decoration_item"   // Objet déco
  // Végétation
  | "plant"             // Plante, arbre, végétation
  // Équipements
  | "technical_equipment"  // Équipement technique (panneau solaire, PAC)
  | "appliance"         // Électroménager
  // Structure
  | "architectural_element"  // Élément architectural (porte, fenêtre)
  // Autre
  | "scene_reference"   // Image d'ambiance/style
  | "custom";
```

---

## 🎯 CONTRAINTES ANTI-ZOOM À AJOUTER

### Ajouts au prompt de génération

```typescript
const STRICT_FRAMING_RULES = `
## ⚠️ CONTRAINTES ABSOLUES DE CADRAGE

### INTERDICTIONS STRICTES:
❌ NE JAMAIS zoomer avant ou arrière
❌ NE JAMAIS recadrer l'image
❌ NE JAMAIS modifier l'angle de vue
❌ NE JAMAIS changer les proportions
❌ NE JAMAIS ajouter/supprimer des éléments hors instructions

### OBLIGATIONS:
✅ Conserver EXACTEMENT le même cadrage que l'IMAGE 1
✅ Conserver EXACTEMENT la même perspective
✅ Conserver EXACTEMENT les mêmes proportions (aspect ratio)
✅ Conserver EXACTEMENT la même position de caméra
✅ Les bords de l'image générée doivent correspondre PIXEL À PIXEL avec l'originale

### VÉRIFICATION:
Si tu superposes l'image originale et l'image générée:
- Les contours architecturaux doivent se superposer parfaitement
- Les angles des murs/plafonds doivent être identiques
- Aucun décalage ne doit être visible
`;
```

---

## 🖼️ INSERTION RÉALISTE D'ÉLÉMENTS

### Règles pour les images de catalogue/3D

```typescript
const REALISTIC_INSERTION_RULES = `
## 🎨 INSERTION PHOTORÉALISTE D'ÉLÉMENTS

### POUR LES PRODUITS DE CATALOGUE / MODÈLES 3D:
1. **Éclairage**: Adapter l'éclairage de l'objet à celui de la scène
   - Observer la direction de la lumière principale
   - Ajouter des ombres cohérentes avec les autres objets
   - Ajuster la luminosité/contraste pour homogénéité

2. **Perspective**: Adapter la perspective de l'objet
   - Calculer le point de fuite de la scène
   - Déformer légèrement l'objet si nécessaire
   - Respecter l'échelle par rapport aux éléments environnants

3. **Ombres & Reflets**:
   - Générer une ombre portée réaliste
   - Ajouter des reflets sur les surfaces brillantes
   - Créer une ombre de contact au sol

4. **Intégration chromatique**:
   - Adapter la température de couleur
   - Ajouter un léger color grading cohérent
   - Gérer les inter-réflexions de couleur

5. **Finition**:
   - Ajouter un léger flou de profondeur si nécessaire
   - Gérer le grain/bruit photo cohérent
   - Pas de bords durs visibles autour de l'objet
`;
```

---

## 📋 PROCHAINES ÉTAPES

1. **Créer la structure de fichiers** `/src/lib/gemini/`
2. **Implémenter les types étendus** dans `types/categories.ts`
3. **Refactoriser les agents** dans des fichiers séparés
4. **Améliorer les prompts** avec les contraintes anti-zoom
5. **Ajouter les règles d'insertion réaliste**
6. **Mettre à jour le fichier principal** pour re-exporter
7. **Tests de non-régression**

---

## ⏱️ ESTIMATION

- **Refactorisation structure**: 2-3 heures
- **Extension des types**: 1 heure
- **Amélioration prompts**: 2 heures
- **Tests**: 1 heure

**Total estimé**: ~6-8 heures de travail

---

*Document généré le 8 janvier 2026*
