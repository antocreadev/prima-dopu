// ============================================================================
// CATÉGORIES D'ÉLÉMENTS - VERSION EXHAUSTIVE TOUS MÉTIERS
// ============================================================================
// Cette liste couvre ABSOLUMENT TOUS les métiers liés au bâtiment, à 
// l'aménagement intérieur/extérieur, à l'habitat et aux espaces professionnels.
//
// MÉTIERS COUVERTS (liste non exhaustive):
// - BTP & Gros œuvre: maçonnerie, béton, charpente, ossature bois
// - Second œuvre: plâtrerie, isolation, cloisons, faux-plafonds
// - Menuiserie: intérieure, extérieure, escaliers, agencement
// - Fermetures: portes, fenêtres, volets, portails, stores
// - Façade: ravalement, enduit, bardage, ITE, pierre
// - Toiture: couverture, zinguerie, étanchéité, gouttières
// - Plomberie: sanitaires, robinetterie, tuyauterie, chauffage
// - Électricité: installation, domotique, éclairage, courants faibles
// - Chauffage/Climatisation: radiateurs, PAC, VMC, cheminées
// - Énergies renouvelables: solaire, géothermie, batteries
// - Paysagisme: jardins, terrasses, piscines, clôtures
// - Décoration: mobilier, textiles, art, accessoires
// - Cuisine: meubles, électroménager, plans de travail
// - Salle de bain: sanitaires, meubles, accessoires
// - Piscine & Spa: bassins, équipements, abris
// - Serrurerie: serrures, blindages, contrôle d'accès
// - Métallerie: grilles, garde-corps, structures métalliques
// - Vitrerie: vitrages, miroirs, verrières
// - Acoustique: isolation phonique, panneaux, studio
// - Commerce: vitrines, enseignes, agencement boutique
// - Bureau: mobilier pro, cloisons, faux-planchers
// - Industrie: équipements techniques, rails, convoyeurs
// - Accessibilité: PMR, rampes, ascenseurs
// - Sécurité: alarmes, vidéosurveillance, contrôle accès
// - Et bien plus encore...
//
// NOTE: L'IA peut créer des catégories "custom" si l'élément ne correspond
// à aucune catégorie existante. La liste n'est JAMAIS limitative.
// ============================================================================

/**
 * Catégories d'éléments identifiables dans une image
 * Liste EXHAUSTIVE pour TOUS les métiers du bâtiment et de l'aménagement
 * 
 * IMPORTANT: Si un élément ne correspond à aucune catégorie, utiliser "custom"
 * avec une description détaillée. L'IA s'adaptera.
 */
export type ElementCategory =
  // ═══════════════════════════════════════════════════════════════════════════
  // SURFACES & REVÊTEMENTS INTÉRIEURS
  // ═══════════════════════════════════════════════════════════════════════════
  | "wall"                        // Murs intérieurs génériques
  | "wall_painted"                // Murs peints
  | "wall_wallpaper"              // Murs papier peint
  | "wall_tile"                   // Murs carrelés
  | "wall_wood_panel"             // Murs lambris bois
  | "wall_stone"                  // Murs pierre apparente
  | "wall_brick"                  // Murs brique apparente
  | "wall_concrete"               // Murs béton apparent
  | "wall_fabric"                 // Murs tissu tendu
  | "wall_cork"                   // Murs liège
  | "wall_glass"                  // Murs/cloisons verre
  | "floor"                       // Sols génériques
  | "floor_parquet"               // Parquet bois
  | "floor_laminate"              // Stratifié
  | "floor_vinyl"                 // Vinyle/PVC
  | "floor_tile"                  // Carrelage sol
  | "floor_marble"                // Marbre
  | "floor_granite"               // Granit
  | "floor_concrete"              // Béton ciré/brut
  | "floor_carpet"                // Moquette
  | "floor_linoleum"              // Linoléum
  | "floor_resin"                 // Résine
  | "floor_terracotta"            // Terre cuite
  | "floor_slate"                 // Ardoise
  | "floor_raised"                // Faux-plancher technique
  | "ceiling"                     // Plafonds génériques
  | "ceiling_plaster"             // Plafond plâtre
  | "ceiling_suspended"           // Faux-plafond suspendu
  | "ceiling_wood"                // Plafond bois
  | "ceiling_beam"                // Plafond poutres apparentes
  | "ceiling_coffered"            // Plafond à caissons
  | "ceiling_stretch"             // Plafond tendu
  | "ceiling_acoustic"            // Plafond acoustique
  | "ceiling_metal"               // Plafond métallique
  | "ceiling_glass"               // Plafond vitré/verrière
  | "facade"                      // Façades extérieures génériques
  | "roof_surface"                // Surface de toiture
  | "terrace_surface"             // Surface de terrasse
| "balcony_surface"             // Surface de balcon
  
  // ═══════════════════════════════════════════════════════════════════════════
  // STRUCTURE & GROS ŒUVRE - MAÇONNERIE
  // ═══════════════════════════════════════════════════════════════════════════
  | "foundation"                  // Fondations
  | "foundation_slab"             // Dalle de fondation
  | "foundation_strip"            // Semelle filante
  | "foundation_pad"              // Plot de fondation
  | "framework"                   // Charpente générique
  | "framework_traditional"       // Charpente traditionnelle
  | "framework_industrial"        // Fermettes industrielles
  | "framework_steel"             // Charpente métallique
  | "beam"                        // Poutres
  | "beam_wood"                   // Poutre bois
  | "beam_steel"                  // Poutre acier (IPN, IPE, HEA)
  | "beam_concrete"               // Poutre béton
  | "beam_laminated"              // Poutre lamellé-collé
  | "column"                      // Poteaux/colonnes génériques
  | "column_wood"                 // Poteau bois
  | "column_steel"                // Poteau acier
  | "column_concrete"             // Poteau béton
  | "column_stone"                // Colonne pierre
  | "column_marble"               // Colonne marbre
  | "load_bearing_wall"           // Murs porteurs
  | "partition"                   // Cloisons génériques
  | "partition_plasterboard"      // Cloison placo/BA13
  | "partition_brick"             // Cloison brique
  | "partition_glass"             // Cloison vitrée
  | "partition_movable"           // Cloison amovible
  | "partition_acoustic"          // Cloison acoustique
  | "partition_japanese"          // Cloison japonaise/coulissante
  | "staircase"                   // Escaliers complets
  | "staircase_straight"          // Escalier droit
  | "staircase_quarter_turn"      // Escalier quart tournant
  | "staircase_half_turn"         // Escalier demi tournant
  | "staircase_spiral"            // Escalier hélicoïdal/colimaçon
  | "staircase_suspended"         // Escalier suspendu
  | "staircase_floating"          // Escalier flottant
  | "stair_step"                  // Marches d'escalier
  | "stair_step_wood"             // Marches bois
  | "stair_step_stone"            // Marches pierre
  | "stair_step_concrete"         // Marches béton
  | "stair_step_glass"            // Marches verre
  | "stair_step_metal"            // Marches métal
  | "stair_railing"               // Rampes d'escalier
  | "stair_railing_wood"          // Rampe bois
  | "stair_railing_metal"         // Rampe métal
  | "stair_railing_glass"         // Rampe verre
  | "stair_railing_cable"         // Rampe câble inox
  | "stair_riser"                 // Contremarches
  | "stair_stringer"              // Limons d'escalier
  | "stair_landing"               // Paliers
  | "mezzanine"                   // Mezzanines
  | "slab"                        // Dalles
  | "slab_concrete"               // Dalle béton
  | "slab_hollow_core"            // Hourdis/prédalles
  | "lintel"                      // Linteaux
  | "arch"                        // Arches, voûtes
  | "vault"                       // Voûtes
  | "pillar"                      // Piliers
  | "buttress"                    // Contreforts
  | "retaining_wall_structural"   // Mur de soutènement structurel
  
  // ═══════════════════════════════════════════════════════════════════════════
  // OSSATURE BOIS & CONSTRUCTION BOIS
  // ═══════════════════════════════════════════════════════════════════════════
  | "timber_frame"                // Ossature bois générique
  | "timber_frame_platform"       // Ossature plateforme
  | "timber_frame_post_beam"      // Poteau-poutre
  | "log_cabin"                   // Madrier/rondins
  | "clt_panel"                   // Panneau CLT/bois massif
  | "timber_truss"                // Ferme bois
  | "timber_joist"                // Solives bois
  | "timber_purlin"               // Pannes bois
  | "timber_rafter"               // Chevrons
  | "timber_batten"               // Liteaux/tasseaux
  
  // ═══════════════════════════════════════════════════════════════════════════
  // ISOLATION & ÉTANCHÉITÉ
  // ═══════════════════════════════════════════════════════════════════════════
  | "insulation_wall"             // Isolation murale
  | "insulation_attic"            // Isolation combles
  | "insulation_floor"            // Isolation sol
  | "insulation_exterior"         // ITE (Isolation Thermique Extérieure)
  | "insulation_interior"         // ITI (Isolation Thermique Intérieure)
  | "insulation_mineral_wool"     // Laine minérale
  | "insulation_glass_wool"       // Laine de verre
  | "insulation_rock_wool"        // Laine de roche
  | "insulation_wood_fiber"       // Fibre de bois
  | "insulation_cellulose"        // Ouate de cellulose
  | "insulation_polystyrene"      // Polystyrène
  | "insulation_polyurethane"     // Polyuréthane
  | "insulation_thin"             // Isolant mince/multicouche
  | "vapor_barrier"               // Pare-vapeur
  | "waterproofing_membrane"      // Membrane d'étanchéité
  | "waterproofing_liquid"        // Étanchéité liquide
  | "drainage_board"              // Drainage de façade
  | "geotextile"                  // Géotextile
  | "dpc_membrane"                // Barrière anti-remontée capillaire
  
  // ═══════════════════════════════════════════════════════════════════════════
  // PLÂTRERIE & STAFF
  // ═══════════════════════════════════════════════════════════════════════════
  | "plasterboard"                // Plaque de plâtre/BA13
  | "plasterboard_hydro"          // Plaque hydrofuge
  | "plasterboard_fire"           // Plaque coupe-feu
  | "plasterboard_acoustic"       // Plaque acoustique
  | "plaster_coating"             // Enduit plâtre
  | "staff_cornice"               // Corniche staff
  | "staff_rosette"               // Rosace plafond
  | "staff_molding"               // Moulures staff
  | "plaster_column"              // Colonne plâtre
  | "niche"                       // Niches murales
  | "coving"                      // Gorges lumineuses
  
  // ═══════════════════════════════════════════════════════════════════════════
  // MENUISERIE INTÉRIEURE - PORTES
  // ═══════════════════════════════════════════════════════════════════════════
  | "interior_door"               // Portes intérieures génériques
  | "interior_door_flush"         // Porte plane/lisse
  | "interior_door_panel"         // Porte à panneaux
  | "interior_door_glazed"        // Porte vitrée
  | "interior_door_louvered"      // Porte persiennée
  | "interior_door_barn"          // Porte grange/loft
  | "sliding_door"                // Portes coulissantes
  | "sliding_door_rail"           // Coulissante sur rail apparent
  | "pocket_door"                 // Portes à galandage
  | "folding_door_interior"       // Porte pliante
  | "pivot_door"                  // Porte pivot
  | "hidden_door"                 // Porte dérobée/invisible
  | "closet_door"                 // Portes de placard
  | "closet_door_sliding"         // Placard coulissant
  | "closet_door_folding"         // Placard pliant
  | "closet_door_hinged"          // Placard battant
  | "door_frame"                  // Encadrements de porte
  | "door_frame_wood"             // Chambranle bois
  | "door_frame_metal"            // Huisserie métal
  | "door_frame_invisible"        // Huisserie invisible
  | "door_handle"                 // Poignées de porte
  | "door_handle_lever"           // Béquille
  | "door_handle_knob"            // Bouton de porte
  | "door_handle_pull"            // Poignée de tirage
  | "door_hinge"                  // Paumelles/charnières
  | "door_closer"                 // Ferme-porte
  | "door_stop"                   // Butoir de porte
  
  // ═══════════════════════════════════════════════════════════════════════════
  // MENUISERIE INTÉRIEURE - MOULURES & FINITIONS
  // ═══════════════════════════════════════════════════════════════════════════
  | "baseboard"                   // Plinthes
  | "baseboard_wood"              // Plinthe bois
  | "baseboard_mdf"               // Plinthe MDF
  | "baseboard_tile"              // Plinthe carrelage
  | "baseboard_alu"               // Plinthe alu
  | "crown_molding"               // Moulures plafond/corniches
  | "chair_rail"                  // Cimaise
  | "picture_rail"                // Moulure porte-tableaux
  | "dado_rail"                   // Moulure de soubassement
  | "wainscoting"                 // Lambris génériques
  | "wainscoting_wood"            // Lambris bois
  | "wainscoting_pvc"             // Lambris PVC
  | "wainscoting_mdf"             // Lambris MDF
  | "panel_molding"               // Moulures décoratives murales
  | "coffered_panel"              // Panneaux à caissons
  | "trim"                        // Baguettes de finition
  | "corner_trim"                 // Baguettes d'angle
  | "threshold"                   // Seuils de porte
  | "transition_strip"            // Barres de seuil
  
  // ═══════════════════════════════════════════════════════════════════════════
  // MENUISERIE INTÉRIEURE - RANGEMENTS
  // ═══════════════════════════════════════════════════════════════════════════
  | "built_in_closet"             // Placards intégrés
  | "walk_in_closet"              // Dressing room
  | "dressing"                    // Dressings
  | "dressing_module"             // Module de dressing
  | "dressing_shelf"              // Étagère dressing
  | "dressing_drawer"             // Tiroirs dressing
  | "dressing_rod"                // Penderie/tringle
  | "shelving"                    // Étagères murales
  | "floating_shelf"              // Étagère flottante
  | "bracket_shelf"               // Étagère sur équerre
  | "built_in_bookcase"           // Bibliothèque intégrée
  | "built_in_unit"               // Meuble encastré
  | "alcove_unit"                 // Meuble d'alcôve
  | "window_seat"                 // Banquette sous fenêtre
  | "storage_bench"               // Banc coffre
  
  // ═══════════════════════════════════════════════════════════════════════════
  // MENUISERIE EXTÉRIEURE - FENÊTRES
  // ═══════════════════════════════════════════════════════════════════════════
  | "window"                      // Fenêtres génériques
  | "window_casement"             // Fenêtre à la française
  | "window_tilt_turn"            // Fenêtre oscillo-battante
  | "window_sliding"              // Fenêtre coulissante
  | "window_fixed"                // Fenêtre fixe/châssis fixe
  | "window_awning"               // Fenêtre à soufflet
  | "window_hopper"               // Fenêtre basculante
  | "window_picture"              // Fenêtre panoramique
  | "window_arched"               // Fenêtre cintrée
  | "window_round"                // Œil-de-bœuf
  | "window_corner"               // Fenêtre d'angle
  | "window_pvc"                  // Fenêtre PVC
  | "window_alu"                  // Fenêtre aluminium
  | "window_wood"                 // Fenêtre bois
  | "window_mixed"                // Fenêtre mixte bois-alu
  | "window_steel"                // Fenêtre acier
  | "french_window"               // Portes-fenêtres
  | "french_window_sliding"       // Baie coulissante
  | "french_window_folding"       // Baie accordéon
  | "french_window_lift_slide"    // Baie à galandage
  | "bay_window"                  // Baies vitrées
  | "bow_window"                  // Bow-window
  | "skylight"                    // Velux génériques
  | "skylight_pivot"              // Velux pivotant
  | "skylight_projection"         // Velux à projection
  | "skylight_flat"               // Fenêtre de toit plat
  | "roof_window"                 // Fenêtres de toit
  | "dormer"                      // Lucarnes
  | "dormer_gable"                // Lucarne à fronton
  | "dormer_eyebrow"              // Lucarne capucine
  | "glass_block"                 // Briques de verre
  | "glazing_double"              // Double vitrage
  | "glazing_triple"              // Triple vitrage
  | "glazing_acoustic"            // Vitrage acoustique
  | "glazing_security"            // Vitrage sécurité
  | "glazing_tinted"              // Vitrage teinté
  | "glazing_frosted"             // Vitrage dépoli
  | "glazing_smart"               // Vitrage électrochrome
  
  // ═══════════════════════════════════════════════════════════════════════════
  // MENUISERIE EXTÉRIEURE - PORTES
  // ═══════════════════════════════════════════════════════════════════════════
  | "exterior_door"               // Portes d'entrée génériques
  | "entry_door_wood"             // Porte entrée bois
  | "entry_door_alu"              // Porte entrée alu
  | "entry_door_steel"            // Porte entrée acier
  | "entry_door_pvc"              // Porte entrée PVC
  | "entry_door_glass"            // Porte entrée vitrée
  | "entry_door_armored"          // Porte blindée
  | "entry_door_double"           // Double porte entrée
  | "garage_door"                 // Portes de garage génériques
  | "garage_door_sectional"       // Porte sectionnelle
  | "garage_door_roller"          // Porte enroulable
  | "garage_door_side_hinged"     // Porte battante
  | "garage_door_slide"           // Porte coulissante latérale
  | "garage_door_tilt"            // Porte basculante
  | "service_door"                // Portes de service
  | "cellar_door"                 // Porte de cave
  | "technical_door"              // Porte technique
  | "fire_door"                   // Porte coupe-feu
  
  // ═══════════════════════════════════════════════════════════════════════════
  // FERMETURES - VOLETS & STORES
  // ═══════════════════════════════════════════════════════════════════════════
  | "shutter"                     // Volets battants génériques
  | "shutter_wood"                // Volet bois
  | "shutter_alu"                 // Volet alu
  | "shutter_pvc"                 // Volet PVC
  | "shutter_composite"           // Volet composite
  | "shutter_louvered"            // Volet persienné
  | "shutter_solid"               // Volet plein
  | "rolling_shutter"             // Volets roulants
  | "rolling_shutter_manual"      // Volet roulant manuel
  | "rolling_shutter_electric"    // Volet roulant électrique
  | "rolling_shutter_solar"       // Volet roulant solaire
  | "rolling_shutter_box"         // Coffre de volet roulant
  | "blind"                       // Stores intérieurs génériques
  | "venetian_blind"              // Store vénitien
  | "vertical_blind"              // Store à bandes verticales
  | "roller_blind"                // Store enrouleur
  | "roman_blind"                 // Store bateau
  | "pleated_blind"               // Store plissé
  | "cellular_blind"              // Store alvéolaire
  | "panel_blind"                 // Store japonais
  | "blackout_blind"              // Store occultant
  | "sheer_blind"                 // Store screen
  | "awning"                      // Stores bannes extérieurs
  | "awning_retractable"          // Store banne rétractable
  | "awning_fixed"                // Store fixe/corbeille
  | "awning_drop_arm"             // Store à projection
  | "awning_window"               // Store de fenêtre extérieur
  | "exterior_screen"             // Brise-soleil orientable
  | "pergola_cover"               // Toile de pergola
  | "mosquito_screen"             // Moustiquaire
  | "fly_screen"                  // Rideau à mouches
  
  // ═══════════════════════════════════════════════════════════════════════════
  // PORTAILS, CLÔTURES & ACCÈS
  // ═══════════════════════════════════════════════════════════════════════════
  | "gate"                        // Portails génériques
  | "gate_swing"                  // Portail battant
  | "gate_sliding"                // Portail coulissant
  | "gate_folding"                // Portail pliant
  | "gate_telescopic"             // Portail télescopique
  | "gate_wood"                   // Portail bois
  | "gate_alu"                    // Portail alu
  | "gate_steel"                  // Portail acier/fer
  | "gate_wrought_iron"           // Portail fer forgé
  | "gate_pvc"                    // Portail PVC
  | "gate_motor"                  // Motorisation portail
  | "pedestrian_gate"             // Portillons
  | "fence"                       // Clôtures génériques
  | "fence_wood"                  // Clôture bois
  | "fence_alu"                   // Clôture alu
  | "fence_pvc"                   // Clôture PVC
  | "fence_steel"                 // Clôture acier
  | "fence_wrought_iron"          // Clôture fer forgé
  | "fence_mesh"                  // Grillage
  | "fence_rigid_panel"           // Panneau rigide
  | "fence_gabion"                // Gabion
  | "fence_composite"             // Clôture composite
  | "fence_glass"                 // Clôture verre
  | "fence_hedge"                 // Clôture végétale
  | "fence_post"                  // Poteaux de clôture
  | "fence_cap"                   // Chapeaux de poteau
  | "bollard"                     // Bornes
  | "gate_intercom"               // Interphone portail
  | "keypad_access"               // Digicode
  | "card_reader"                 // Lecteur de badge
  | "barrier"                     // Barrière levante
  | "turnstile"                   // Tourniquet
  
  // ═══════════════════════════════════════════════════════════════════════════
  // GARDE-CORPS & BALUSTRADES
  // ═══════════════════════════════════════════════════════════════════════════
  | "railing"                     // Garde-corps génériques
  | "railing_glass"               // Garde-corps verre
  | "railing_steel"               // Garde-corps acier
  | "railing_cable"               // Garde-corps câble inox
  | "railing_wood"                // Garde-corps bois
  | "railing_alu"                 // Garde-corps alu
  | "railing_wrought_iron"        // Garde-corps fer forgé
  | "railing_mixed"               // Garde-corps mixte
  | "balustrade"                  // Balustrades
  | "balustrade_stone"            // Balustrade pierre
  | "balustrade_concrete"         // Balustrade béton
  | "baluster"                    // Barreaux/balustres
  | "handrail"                    // Main courante
  | "handrail_wall"               // Main courante murale
  | "glass_panel"                 // Panneau verre garde-corps
  
  // ═══════════════════════════════════════════════════════════════════════════
  // PERGOLAS, VÉRANDAS & STRUCTURES EXTÉRIEURES
  // ═══════════════════════════════════════════════════════════════════════════
  | "pergola"                     // Pergolas génériques
  | "pergola_wood"                // Pergola bois
  | "pergola_alu"                 // Pergola alu
  | "pergola_steel"               // Pergola acier
  | "pergola_bioclimatic"         // Pergola bioclimatique
  | "pergola_retractable"         // Pergola rétractable
  | "arbor"                       // Tonnelles
  | "gazebo"                      // Gloriettes/kiosques
  | "carport"                     // Carports
  | "carport_wood"                // Carport bois
  | "carport_alu"                 // Carport alu
  | "carport_steel"               // Carport acier
  | "veranda"                     // Vérandas
  | "veranda_alu"                 // Véranda alu
  | "veranda_pvc"                 // Véranda PVC
  | "veranda_steel"               // Véranda acier
  | "glass_canopy"                // Marquises vitrées
  | "entrance_canopy"             // Auvent d'entrée
  | "awning_canopy"               // Auvent toile
  | "outdoor_room"                // Pool house/pièce extérieure
  | "garden_room"                 // Bureau de jardin
  | "greenhouse"                  // Serres
  | "cold_frame"                  // Châssis de jardin
  | "conservatory"                // Jardin d'hiver
  
  // ═══════════════════════════════════════════════════════════════════════════
  // SERRURERIE & CONTRÔLE D'ACCÈS
  // ═══════════════════════════════════════════════════════════════════════════
  | "lock"                        // Serrures génériques
  | "lock_cylinder"               // Cylindre de serrure
  | "lock_multipoint"             // Serrure multipoints
  | "lock_electronic"             // Serrure électronique
  | "lock_biometric"              // Serrure biométrique
  | "lock_smart"                  // Serrure connectée
  | "deadbolt"                    // Verrou
  | "latch"                       // Loquet
  | "padlock"                     // Cadenas
  | "door_chain"                  // Chaîne de porte
  | "peephole"                    // Judas
  | "digital_peephole"            // Judas numérique
  | "armored_door"                // Porte blindée
  | "security_bar"                // Barre de sécurité
  | "window_lock"                 // Verrou de fenêtre
  | "window_handle_lock"          // Poignée à clé
  | "safe"                        // Coffre-fort
  | "wall_safe"                   // Coffre encastré
  | "key_box"                     // Boîte à clés
  
  // ═══════════════════════════════════════════════════════════════════════════
  // MÉTALLERIE & FERRONNERIE
  // ═══════════════════════════════════════════════════════════════════════════
  | "metal_structure"             // Structure métallique
  | "steel_beam"                  // Poutre acier
  | "steel_column"                // Poteau acier
  | "metal_staircase"             // Escalier métallique
  | "metal_railing"               // Garde-corps métallique
  | "wrought_iron_work"           // Ferronnerie d'art
  | "decorative_grille"           // Grille décorative
  | "window_grille"               // Grille de fenêtre
  | "security_grille"             // Grille de défense
  | "metal_gate"                  // Portail métallique
  | "metal_fence"                 // Clôture métallique
  | "metal_canopy"                // Marquise métallique
  | "fire_escape"                 // Escalier de secours
  | "metal_floor"                 // Plancher métallique
  | "grating"                     // Caillebotis
  | "metal_mesh"                  // Grillage métallique
  | "expanded_metal"              // Métal déployé
  | "perforated_metal"            // Tôle perforée
  
  // ═══════════════════════════════════════════════════════════════════════════
  // VITRERIE & MIROITERIE
  // ═══════════════════════════════════════════════════════════════════════════
  | "glass_wall"                  // Mur de verre
  | "glass_partition"             // Cloison vitrée
  | "glass_door"                  // Porte vitrée
  | "glass_canopy_vitrage"        // Verrière/marquise
  | "roof_glazing"                // Verrière de toit
  | "atrium_glazing"              // Verrière d'atrium
  | "glass_floor"                 // Plancher de verre
  | "glass_stair"                 // Escalier en verre
  | "mirror"                      // Miroirs génériques
  | "mirror_wall"                 // Mur miroir
  | "mirror_bathroom"             // Miroir salle de bain
  | "mirror_decorative"           // Miroir décoratif
  | "mirror_full_length"          // Miroir en pied
  | "antiqued_mirror"             // Miroir vieilli
  | "glass_splashback"            // Crédence verre
  | "glass_balustrade"            // Balustrade verre
  | "glass_table_top"             // Plateau de table verre
  | "glass_shelf"                 // Étagère verre
  | "lacquered_glass"             // Verre laqué
  | "etched_glass"                // Verre gravé
  | "stained_glass"               // Vitrail
  | "decorative_glass"            // Verre décoratif
  
  // ═══════════════════════════════════════════════════════════════════════════
  // MOBILIER - SALON & SÉJOUR
  // ═══════════════════════════════════════════════════════════════════════════
  | "sofa"                        // Canapés génériques
  | "sofa_corner"                 // Canapé d'angle
  | "sofa_modular"                // Canapé modulable
  | "sofa_bed"                    // Canapé convertible
  | "sofa_chesterfield"           // Canapé Chesterfield
  | "sofa_sectional"              // Canapé panoramique
  | "loveseat"                    // Causeuse
  | "daybed"                      // Méridienne
  | "chaise_longue"               // Chaise longue
  | "armchair"                    // Fauteuils génériques
  | "armchair_accent"             // Fauteuil d'appoint
  | "armchair_club"               // Fauteuil club
  | "armchair_bergere"            // Bergère
  | "armchair_rocking"            // Rocking-chair
  | "armchair_swivel"             // Fauteuil pivotant
  | "armchair_recliner"           // Fauteuil relax
  | "armchair_egg"                // Fauteuil œuf
  | "armchair_wing"               // Fauteuil à oreilles
  | "pouf"                        // Poufs
  | "ottoman"                     // Repose-pieds
  | "bean_bag"                    // Pouf poire
  | "floor_cushion"               // Coussin de sol
  | "bench_indoor"                // Banc d'intérieur
  | "coffee_table"                // Tables basses
  | "coffee_table_round"          // Table basse ronde
  | "coffee_table_square"         // Table basse carrée
  | "coffee_table_oval"           // Table basse ovale
  | "coffee_table_nesting"        // Tables gigognes
  | "coffee_table_lift"           // Table basse relevable
  | "side_table"                  // Tables d'appoint
  | "end_table"                   // Bout de canapé
  | "console"                     // Consoles
  | "console_entrance"            // Console d'entrée
  | "tv_stand"                    // Meubles TV génériques
  | "tv_console"                  // Console TV basse
  | "tv_cabinet"                  // Meuble TV fermé
  | "tv_wall_unit"                // Ensemble mural TV
  | "media_center"                // Centre multimédia
  | "tv_mount"                    // Support TV mural
  | "fireplace_mantel"            // Manteau de cheminée
  | "bookcase"                    // Bibliothèques
  | "bookcase_modular"            // Bibliothèque modulable
  | "bookcase_ladder"             // Bibliothèque échelle
  | "bookcase_corner"             // Bibliothèque d'angle
  | "display_cabinet"             // Vitrines
  | "curio_cabinet"               // Vitrine collection
  | "sideboard"                   // Buffets
  | "buffet_server"               // Buffet servant
  | "credenza"                    // Crédence/enfilade
  | "bar_cabinet"                 // Meuble bar
  | "wine_rack"                   // Casier à vin
  | "room_divider"                // Paravent/séparateur
  | "screen"                      // Paravent décoratif
  
  // ═══════════════════════════════════════════════════════════════════════════
  // MOBILIER - SALLE À MANGER
  // ═══════════════════════════════════════════════════════════════════════════
  | "dining_table"                // Tables à manger
  | "dining_table_round"          // Table ronde
  | "dining_table_oval"           // Table ovale
  | "dining_table_rectangular"    // Table rectangulaire
  | "dining_table_extendable"     // Table extensible
  | "dining_table_drop_leaf"      // Table à abattants
  | "dining_table_pedestal"       // Table pied central
  | "dining_table_trestle"        // Table tréteaux
  | "chair"                       // Chaises génériques
  | "dining_chair"                // Chaise de salle à manger
  | "dining_chair_upholstered"    // Chaise rembourrée
  | "dining_chair_wood"           // Chaise bois
  | "dining_chair_metal"          // Chaise métal
  | "dining_chair_plastic"        // Chaise plastique design
  | "dining_chair_cane"           // Chaise cannée
  | "stool"                       // Tabourets génériques
  | "bar_stool"                   // Tabouret de bar
  | "counter_stool"               // Tabouret comptoir
  | "stool_adjustable"            // Tabouret réglable
  | "stool_backless"              // Tabouret sans dossier
  | "bench"                       // Bancs
  | "dining_bench"                // Banc de table
  | "storage_bench_dining"        // Banc coffre salle à manger
  | "china_cabinet"               // Vaisselier
  | "hutch"                       // Buffet vaisselier
  | "serving_cart"                // Desserte
  | "bar_cart"                    // Desserte bar
  
  // ═══════════════════════════════════════════════════════════════════════════
  // MOBILIER - BUREAU & TRAVAIL
  // ═══════════════════════════════════════════════════════════════════════════
  | "desk"                        // Bureaux génériques
  | "desk_executive"              // Bureau de direction
  | "desk_writing"                // Bureau secrétaire
  | "desk_computer"               // Bureau informatique
  | "desk_corner"                 // Bureau d'angle
  | "desk_standing"               // Bureau assis-debout
  | "desk_floating"               // Bureau suspendu
  | "desk_fold"                   // Bureau pliant
  | "office_chair"                // Chaises de bureau
  | "office_chair_ergonomic"      // Fauteuil ergonomique
  | "office_chair_executive"      // Fauteuil direction
  | "office_chair_task"           // Chaise de travail
  | "office_chair_kneeling"       // Siège assis-genoux
  | "office_chair_saddle"         // Tabouret selle
  | "office_cabinet"              // Armoire de bureau
  | "filing_cabinet"              // Classeur
  | "file_cabinet_lateral"        // Classeur latéral
  | "mobile_pedestal"             // Caisson mobile
  | "credenza_office"             // Crédence de bureau
  | "bookcase_office"             // Bibliothèque bureau
  | "monitor_stand"               // Support écran
  | "keyboard_tray"               // Tablette clavier
  | "cable_management"            // Gestion des câbles
  | "desk_lamp_work"              // Lampe de bureau travail
  | "whiteboard"                  // Tableau blanc
  | "corkboard"                   // Panneau liège
  | "notice_board"                // Panneau d'affichage
  
  // ═══════════════════════════════════════════════════════════════════════════
  // MOBILIER - CHAMBRE
  // ═══════════════════════════════════════════════════════════════════════════
  | "bed"                         // Lits génériques
  | "bed_single"                  // Lit simple
  | "bed_double"                  // Lit double
  | "bed_queen"                   // Lit queen size
  | "bed_king"                    // Lit king size
  | "bed_platform"                // Lit plateforme
  | "bed_canopy"                  // Lit à baldaquin
  | "bed_sleigh"                  // Lit traîneau
  | "bed_panel"                   // Lit à panneaux
  | "bed_storage"                 // Lit coffre
  | "bed_murphy"                  // Lit escamotable
  | "bed_bunk"                    // Lit superposé
  | "bed_loft"                    // Lit mezzanine
  | "bed_trundle"                 // Lit gigogne
  | "bed_daybed"                  // Lit banquette
  | "bed_adjustable"              // Lit électrique/articulé
  | "headboard"                   // Têtes de lit
  | "headboard_upholstered"       // Tête de lit capitonnée
  | "headboard_wood"              // Tête de lit bois
  | "headboard_metal"             // Tête de lit métal
  | "headboard_cane"              // Tête de lit cannée
  | "footboard"                   // Pied de lit
  | "bed_frame"                   // Cadre de lit
  | "mattress"                    // Matelas
  | "box_spring"                  // Sommier tapissier
  | "bed_slats"                   // Sommier à lattes
  | "nightstand"                  // Tables de chevet
  | "nightstand_floating"         // Chevet suspendu
  | "bedside_table"               // Table de nuit
  | "wardrobe"                    // Armoires
  | "wardrobe_hinged"             // Armoire battante
  | "wardrobe_sliding"            // Armoire coulissante
  | "wardrobe_corner"             // Armoire d'angle
  | "armoire"                     // Armoire ancienne
  | "dresser"                     // Commodes
  | "dresser_tall"                // Chiffonnier
  | "chest_of_drawers"            // Commode à tiroirs
  | "lingerie_chest"              // Semainier
  | "chest"                       // Coffres
  | "blanket_chest"               // Coffre à couvertures
  | "hope_chest"                  // Coffre de dot
  | "trunk"                       // Malle
  | "vanity_table"                // Coiffeuse
  | "makeup_vanity"               // Meuble maquillage
  | "jewelry_armoire"             // Armoire à bijoux
  | "valet_stand"                 // Valet de chambre
  | "full_length_mirror"          // Miroir sur pied
  
  // ═══════════════════════════════════════════════════════════════════════════
  // ÉCLAIRAGE - INTÉRIEUR
  // ═══════════════════════════════════════════════════════════════════════════
  | "chandelier"                  // Lustres génériques
  | "chandelier_crystal"          // Lustre cristal
  | "chandelier_modern"           // Lustre moderne
  | "chandelier_rustic"           // Lustre rustique
  | "chandelier_industrial"       // Lustre industriel
  | "chandelier_candle"           // Lustre bougies
  | "pendant_light"               // Suspensions
  | "pendant_single"              // Suspension simple
  | "pendant_cluster"             // Suspension grappe
  | "pendant_linear"              // Suspension linéaire
  | "pendant_drum"                // Suspension tambour
  | "pendant_globe"               // Suspension globe
  | "pendant_lantern"             // Suspension lanterne
  | "pendant_cage"                // Suspension cage
  | "pendant_paper"               // Suspension papier
  | "ceiling_light"               // Plafonniers
  | "ceiling_light_flush"         // Plafonnier affleurant
  | "ceiling_light_semi_flush"    // Plafonnier semi-affleurant
  | "ceiling_light_led"           // Plafonnier LED
  | "ceiling_light_decorative"    // Plafonnier décoratif
  | "recessed_light"              // Spots encastrés
  | "recessed_light_adjustable"   // Spot orientable
  | "recessed_light_fixed"        // Spot fixe
  | "recessed_light_square"       // Spot carré
  | "recessed_light_round"        // Spot rond
  | "track_light"                 // Spots sur rail
  | "track_system"                // Système rail
  | "track_head"                  // Tête de spot rail
  | "monorail"                    // Monorail
  | "wall_sconce"                 // Appliques murales
  | "wall_sconce_up"              // Applique vers le haut
  | "wall_sconce_down"            // Applique vers le bas
  | "wall_sconce_up_down"         // Applique bidirectionnelle
  | "wall_sconce_swing"           // Applique articulée
  | "picture_light"               // Éclairage tableaux
  | "bathroom_vanity_light"       // Applique salle de bain
  | "floor_lamp"                  // Lampadaires
  | "floor_lamp_arc"              // Lampadaire arc
  | "floor_lamp_tripod"           // Lampadaire trépied
  | "floor_lamp_torchiere"        // Lampadaire vasque
  | "floor_lamp_reading"          // Liseuse sur pied
  | "floor_lamp_tree"             // Lampadaire arbre
  | "table_lamp"                  // Lampes de table
  | "table_lamp_buffet"           // Lampe buffet
  | "table_lamp_accent"           // Lampe d'accent
  | "table_lamp_tiffany"          // Lampe Tiffany
  | "table_lamp_touch"            // Lampe tactile
  | "desk_lamp"                   // Lampes de bureau
  | "desk_lamp_architect"         // Lampe architecte
  | "desk_lamp_led"               // Lampe LED bureau
  | "desk_lamp_clamp"             // Lampe à pince
  | "bedside_lamp"                // Lampe de chevet
  | "reading_lamp"                // Liseuse
  | "led_strip"                   // Rubans LED
  | "led_strip_rgb"               // Ruban LED RGB
  | "led_strip_warm"              // Ruban LED blanc chaud
  | "led_strip_cool"              // Ruban LED blanc froid
  | "cove_lighting"               // Éclairage indirect corniche
  | "under_cabinet_light"         // Éclairage sous meuble
  | "shelf_light"                 // Éclairage étagère
  | "closet_light"                // Éclairage placard
  | "stair_light"                 // Éclairage escalier
  | "floor_washer"                // Éclairage de sol
  | "accent_light"                // Éclairage d'accent
  | "mirror_light"                // Éclairage miroir
  | "night_light"                 // Veilleuse
  | "smart_bulb"                  // Ampoule connectée
  | "dimmer_switch"               // Variateur d'intensité
  
  // ═══════════════════════════════════════════════════════════════════════════
  // ÉCLAIRAGE - EXTÉRIEUR
  // ═══════════════════════════════════════════════════════════════════════════
  | "outdoor_wall_light"          // Appliques extérieures
  | "outdoor_wall_lantern"        // Lanterne murale
  | "outdoor_wall_modern"         // Applique extérieure moderne
  | "outdoor_wall_sensor"         // Applique à détecteur
  | "bollard_light"               // Bornes lumineuses
  | "bollard_led"                 // Borne LED
  | "bollard_solar"               // Borne solaire
  | "path_light"                  // Balises de jardin
  | "path_light_stake"            // Balise à piquer
  | "path_light_recessed"         // Balise encastrée
  | "spotlight"                   // Projecteurs
  | "floodlight"                  // Projecteur grande zone
  | "spot_garden"                 // Spot de jardin
  | "spot_tree"                   // Éclairage d'arbre
  | "spot_facade"                 // Éclairage de façade
  | "underwater_light"            // Éclairage subaquatique
  | "pool_light"                  // Éclairage piscine
  | "deck_light"                  // Éclairage terrasse
  | "step_light"                  // Éclairage marches ext
  | "post_light"                  // Lampadaire extérieur
  | "pendant_outdoor"             // Suspension extérieure
  | "string_light"                // Guirlande lumineuse
  | "festoon_light"               // Guirlande guinguette
  | "fairy_light"                 // Guirlande féerique
  | "solar_light"                 // Éclairage solaire
  | "solar_path_light"            // Balise solaire
  | "solar_wall_light"            // Applique solaire
  | "motion_sensor_light"         // Éclairage à détection
  | "dusk_to_dawn_light"          // Éclairage crépusculaire
  | "landscape_light"             // Éclairage paysager
  | "well_light"                  // Encastré de sol
  | "in_ground_light"             // Spot encastré sol
  
  // ═══════════════════════════════════════════════════════════════════════════
  // PLOMBERIE - SANITAIRES GÉNÉRAUX
  // ═══════════════════════════════════════════════════════════════════════════
  | "kitchen_sink"                // Éviers de cuisine
  | "kitchen_sink_single"         // Évier simple bac
  | "kitchen_sink_double"         // Évier double bac
  | "kitchen_sink_undermount"     // Évier sous plan
  | "kitchen_sink_farmhouse"      // Évier timbre d'office
  | "kitchen_sink_stainless"      // Évier inox
  | "kitchen_sink_granite"        // Évier granit
  | "kitchen_sink_ceramic"        // Évier céramique
  | "bathroom_sink"               // Lavabos génériques
  | "sink_pedestal"               // Lavabo sur colonne
  | "sink_console"                // Lavabo console
  | "sink_wall_hung"              // Lavabo suspendu
  | "sink_drop_in"                // Lavabo à encastrer
  | "sink_undermount"             // Lavabo sous plan
  | "sink_vessel"                 // Vasque à poser
  | "sink_semi_recessed"          // Lavabo semi-encastré
  | "sink_corner"                 // Lavabo d'angle
  | "sink_trough"                 // Lavabo auge
  | "sink_double"                 // Double vasque
  | "sink_furniture"              // Lave-mains
  | "toilet"                      // WC génériques
  | "toilet_floor"                // WC à poser
  | "toilet_wall_hung"            // WC suspendu
  | "toilet_back_to_wall"         // WC adossé
  | "toilet_close_coupled"        // WC monobloc
  | "toilet_high_tank"            // WC rétro
  | "toilet_smart"                // WC japonais/lavant
  | "toilet_rimless"              // WC sans bride
  | "toilet_seat"                 // Abattant WC
  | "toilet_seat_soft_close"      // Abattant frein de chute
  | "concealed_cistern"           // Réservoir encastré
  | "flush_plate"                 // Plaque de commande
  | "bidet"                       // Bidets
  | "bidet_floor"                 // Bidet à poser
  | "bidet_wall_hung"             // Bidet suspendu
  | "urinal"                      // Urinoirs
  
  // ═══════════════════════════════════════════════════════════════════════════
  // PLOMBERIE - BAIN & DOUCHE
  // ═══════════════════════════════════════════════════════════════════════════
  | "bathtub"                     // Baignoires génériques
  | "bathtub_alcove"              // Baignoire encastrée
  | "bathtub_drop_in"             // Baignoire à encastrer
  | "bathtub_freestanding"        // Baignoire îlot
  | "bathtub_corner"              // Baignoire d'angle
  | "bathtub_clawfoot"            // Baignoire pattes de lion
  | "bathtub_oval"                // Baignoire ovale
  | "bathtub_rectangular"         // Baignoire rectangulaire
  | "bathtub_whirlpool"           // Baignoire balnéo
  | "bathtub_walk_in"             // Baignoire à porte
  | "bathtub_baby"                // Baignoire bébé encastrée
  | "bathtub_panel"               // Tablier de baignoire
  | "bathtub_screen"              // Pare-baignoire
  | "shower"                      // Douches génériques
  | "shower_enclosure"            // Cabine de douche
  | "shower_walk_in"              // Douche à l'italienne
  | "shower_corner"               // Douche d'angle
  | "shower_quadrant"             // Douche quart de rond
  | "shower_rectangular"          // Douche rectangulaire
  | "shower_steam"                // Douche hammam
  | "shower_wet_room"             // Salle d'eau ouverte
  | "shower_base"                 // Receveur de douche
  | "shower_base_tile"            // Receveur à carreler
  | "shower_base_acrylic"         // Receveur acrylique
  | "shower_base_stone"           // Receveur pierre
  | "shower_channel"              // Caniveau de douche
  | "shower_drain"                // Bonde de douche
  | "shower_screen"               // Paroi de douche
  | "shower_door"                 // Porte de douche
  | "shower_door_pivot"           // Porte pivotante
  | "shower_door_sliding"         // Porte coulissante
  | "shower_door_folding"         // Porte pliante
  | "shower_panel_fixed"          // Paroi fixe
  | "shower_niche"                // Niche de douche
  | "shower_bench"                // Banc de douche
  | "shower_seat"                 // Siège de douche
  
  // ═══════════════════════════════════════════════════════════════════════════
  // PLOMBERIE - ROBINETTERIE
  // ═══════════════════════════════════════════════════════════════════════════
  | "faucet"                      // Robinets génériques
  | "faucet_single_hole"          // Mitigeur monotrou
  | "faucet_widespread"           // Mélangeur 3 trous
  | "faucet_wall_mount"           // Robinet mural
  | "faucet_bridge"               // Mélangeur pont
  | "faucet_pull_out"             // Mitigeur avec douchette
  | "faucet_pull_down"            // Mitigeur à bec extractible
  | "faucet_touchless"            // Robinet sans contact
  | "faucet_pot_filler"           // Robinet d'appoint cuisine
  | "bathtub_faucet"              // Robinet de baignoire
  | "bathtub_faucet_deck"         // Mitigeur sur gorge
  | "bathtub_faucet_floor"        // Mitigeur sur pied
  | "bathtub_filler"              // Remplissage baignoire
  | "shower_system"               // Colonne de douche
  | "shower_mixer"                // Mitigeur de douche
  | "shower_mixer_thermostatic"   // Mitigeur thermostatique
  | "shower_mixer_manual"         // Mitigeur mécanique
  | "shower_valve"                // Robinet encastré
  | "showerhead"                  // Pommeaux de douche
  | "showerhead_fixed"            // Pomme fixe
  | "showerhead_handheld"         // Douchette
  | "showerhead_rain"             // Pomme de pluie
  | "showerhead_cascade"          // Pomme cascade
  | "showerhead_led"              // Pomme LED
  | "shower_arm"                  // Bras de douche
  | "shower_hose"                 // Flexible de douche
  | "shower_rail"                 // Barre de douche
  | "body_jet"                    // Jets de massage
  
  // ═══════════════════════════════════════════════════════════════════════════
  // PLOMBERIE - EAU CHAUDE & TUYAUTERIE
  // ═══════════════════════════════════════════════════════════════════════════
  | "water_heater"                // Chauffe-eau génériques
  | "water_heater_tank"           // Cumulus/ballon
  | "water_heater_tankless"       // Chauffe-eau instantané
  | "water_heater_heat_pump"      // Chauffe-eau thermodynamique
  | "water_heater_solar"          // Chauffe-eau solaire
  | "water_heater_gas"            // Chauffe-eau gaz
  | "expansion_tank"              // Vase d'expansion
  | "water_softener"              // Adoucisseur d'eau
  | "water_filter"                // Filtre à eau
  | "water_filter_under_sink"     // Filtre sous évier
  | "reverse_osmosis"             // Osmoseur
  | "water_meter"                 // Compteur d'eau
  | "main_shutoff"                // Vanne générale
  | "pressure_reducer"            // Réducteur de pression
  | "backflow_preventer"          // Clapet anti-retour
  | "piping"                      // Tuyauterie visible
  | "piping_copper"               // Tube cuivre
  | "piping_pex"                  // Tube PER
  | "piping_pvc"                  // Tube PVC
  | "piping_multilayer"           // Tube multicouche
  | "manifold"                    // Collecteur/nourrice
  | "drain"                       // Évacuations
  | "drain_floor"                 // Siphon de sol
  | "p_trap"                      // Siphon
  | "towel_radiator"              // Sèche-serviettes
  | "towel_radiator_electric"     // Sèche-serviettes électrique
  | "towel_radiator_water"        // Sèche-serviettes eau chaude
  | "towel_radiator_dual"         // Sèche-serviettes mixte
  
  // ═══════════════════════════════════════════════════════════════════════════
  // CHAUFFAGE - RADIATEURS & ÉMETTEURS
  // ═══════════════════════════════════════════════════════════════════════════
  | "radiator"                    // Radiateurs génériques
  | "radiator_panel"              // Radiateur panneau acier
  | "radiator_column"             // Radiateur à colonnes
  | "radiator_cast_iron"          // Radiateur fonte
  | "radiator_aluminum"           // Radiateur alu
  | "radiator_vertical"           // Radiateur vertical
  | "radiator_horizontal"         // Radiateur horizontal
  | "radiator_low"                // Radiateur plinthe
  | "designer_radiator"           // Radiateur design
  | "radiator_towel"              // Radiateur sèche-serviettes
  | "electric_radiator"           // Radiateur électrique
  | "radiator_inertia"            // Radiateur à inertie
  | "radiator_radiant"            // Panneau rayonnant
  | "convector"                   // Convecteurs
  | "convector_electric"          // Convecteur électrique
  | "convector_gas"               // Convecteur gaz
  | "baseboard_heater"            // Plinthes chauffantes
  | "fan_coil"                    // Ventilo-convecteur
  | "underfloor_heating"          // Plancher chauffant
  | "underfloor_water"            // Plancher eau chaude
  | "underfloor_electric"         // Plancher électrique
  | "ceiling_heating"             // Plafond chauffant
  | "wall_heating"                // Mur chauffant
  | "heated_mirror"               // Miroir chauffant
  | "infrared_heater"             // Chauffage infrarouge
  | "infrared_panel"              // Panneau infrarouge
  
  // ═══════════════════════════════════════════════════════════════════════════
  // CHAUFFAGE - CHEMINÉES & POÊLES
  // ═══════════════════════════════════════════════════════════════════════════
  | "fireplace"                   // Cheminées génériques
  | "fireplace_open"              // Cheminée foyer ouvert
  | "fireplace_closed"            // Cheminée foyer fermé
  | "fireplace_insert"            // Insert de cheminée
  | "fireplace_built_in"          // Cheminée encastrée
  | "fireplace_corner"            // Cheminée d'angle
  | "fireplace_double_sided"      // Cheminée double face
  | "fireplace_suspended"         // Cheminée suspendue
  | "fireplace_mantel"            // Manteau de cheminée
  | "fireplace_surround"          // Habillage de cheminée
  | "fireplace_hearth"            // Âtre de cheminée
  | "wood_stove"                  // Poêles à bois
  | "wood_stove_modern"           // Poêle contemporain
  | "wood_stove_traditional"      // Poêle traditionnel
  | "wood_stove_corner"           // Poêle d'angle
  | "wood_stove_insert"           // Insert bois
  | "pellet_stove"                // Poêles à granulés
  | "pellet_stove_air"            // Poêle granulés air
  | "pellet_stove_hydro"          // Poêle granulés hydraulique
  | "pellet_insert"               // Insert granulés
  | "gas_fireplace"               // Cheminées au gaz
  | "gas_stove"                   // Poêle à gaz
  | "bioethanol_fireplace"        // Cheminée bioéthanol
  | "electric_fireplace"          // Cheminées électriques
  | "electric_fire_insert"        // Insert électrique
  | "fire_log_set"                // Bûches décoratives
  | "log_storage"                 // Rangement bûches
  | "fire_screen"                 // Pare-feu
  | "fire_tools"                  // Accessoires cheminée
  | "ash_vacuum"                  // Aspirateur à cendres
  
  // ═══════════════════════════════════════════════════════════════════════════
  // CHAUFFAGE - CHAUDIÈRES & PRODUCTION
  // ═══════════════════════════════════════════════════════════════════════════
  | "boiler"                      // Chaudières génériques
  | "gas_boiler"                  // Chaudière gaz
  | "condensing_boiler"           // Chaudière à condensation
  | "oil_boiler"                  // Chaudière fioul
  | "wood_boiler"                 // Chaudière bois
  | "pellet_boiler"               // Chaudière granulés
  | "electric_boiler"             // Chaudière électrique
  | "combi_boiler"                // Chaudière mixte
  | "boiler_flue"                 // Conduit de fumée
  | "boiler_room"                 // Local chaufferie
  | "buffer_tank"                 // Ballon tampon
  | "storage_tank"                // Ballon de stockage
  | "fuel_tank"                   // Cuve fioul
  | "pellet_storage"              // Silo à granulés
  | "heating_manifold"            // Collecteur chauffage
  | "circulation_pump"            // Circulateur
  | "mixing_valve"                // Vanne de mélange
  | "zone_valve"                  // Vanne de zone
  
  // ═══════════════════════════════════════════════════════════════════════════
  // ÉLECTRICITÉ - DISTRIBUTION & PROTECTION
  // ═══════════════════════════════════════════════════════════════════════════
  | "electrical_panel"            // Tableaux électriques
  | "main_panel"                  // Tableau général
  | "sub_panel"                   // Tableau divisionnaire
  | "circuit_breaker"             // Disjoncteur
  | "differential_breaker"        // Différentiel
  | "fuse_box"                    // Boîte à fusibles
  | "surge_protector"             // Parafoudre
  | "contactor"                   // Contacteur
  | "timer_switch"                // Horloge programmable
  | "electric_meter"              // Compteurs électriques
  | "smart_meter"                 // Compteur Linky
  | "sub_meter"                   // Sous-compteur
  
  // ═══════════════════════════════════════════════════════════════════════════
  // ÉLECTRICITÉ - PRISES & INTERRUPTEURS
  // ═══════════════════════════════════════════════════════════════════════════
  | "outlet"                      // Prises génériques
  | "outlet_standard"             // Prise 16A
  | "outlet_grounded"             // Prise avec terre
  | "outlet_double"               // Double prise
  | "outlet_triple"               // Triple prise
  | "outlet_floor"                // Prise de sol
  | "outlet_pop_up"               // Prise escamotable
  | "outlet_usb"                  // Prise USB intégrée
  | "outlet_ip44"                 // Prise étanche
  | "outlet_shaver"               // Prise rasoir
  | "outlet_tv"                   // Prise TV
  | "outlet_rj45"                 // Prise RJ45
  | "outlet_phone"                // Prise téléphone
  | "outlet_fiber"                // Prise fibre optique
  | "dedicated_outlet"            // Prise spécialisée
  | "stove_outlet"                // Prise cuisinière
  | "dryer_outlet"                // Prise sèche-linge
  | "switch"                      // Interrupteurs génériques
  | "switch_single"               // Interrupteur simple
  | "switch_double"               // Double interrupteur
  | "switch_two_way"              // Va-et-vient
  | "switch_intermediate"         // Permutateur
  | "switch_push"                 // Bouton poussoir
  | "switch_toggle"               // Interrupteur à bascule
  | "switch_rocker"               // Interrupteur à levier
  | "switch_touch"                // Interrupteur tactile
  | "dimmer"                      // Variateurs
  | "dimmer_rotary"               // Variateur rotatif
  | "dimmer_slide"                // Variateur à curseur
  | "dimmer_touch"                // Variateur tactile
  | "dimmer_led"                  // Variateur LED
  | "switch_plate"                // Plaque d'interrupteur
  | "switch_frame"                // Cadre d'appareillage
  | "blank_plate"                 // Plaque aveugle
  | "junction_box"                // Boîte de dérivation
  | "ceiling_rose"                // Rosace de plafond
  
  // ═══════════════════════════════════════════════════════════════════════════
  // DOMOTIQUE & SMART HOME
  // ═══════════════════════════════════════════════════════════════════════════
  | "smart_switch"                // Interrupteurs connectés
  | "smart_outlet"                // Prise connectée
  | "smart_dimmer"                // Variateur connecté
  | "smart_thermostat"            // Thermostats connectés
  | "thermostat"                  // Thermostats génériques
  | "thermostat_programmable"     // Thermostat programmable
  | "thermostat_zone"             // Thermostat de zone
  | "smart_hub"                   // Box domotique
  | "smart_speaker"               // Enceinte connectée
  | "voice_assistant"             // Assistant vocal
  | "smart_display"               // Écran connecté
  | "home_controller"             // Écran de contrôle
  | "scene_controller"            // Télécommande scénarios
  | "smart_sensor"                // Capteur connecté
  | "temperature_sensor"          // Capteur température
  | "humidity_sensor"             // Capteur humidité
  | "air_quality_sensor"          // Capteur qualité air
  | "co2_sensor"                  // Capteur CO2
  | "water_leak_sensor"           // Détecteur fuite
  | "door_sensor"                 // Capteur porte/fenêtre
  | "smart_lock"                  // Serrure connectée
  | "smart_blind"                 // Store connecté
  | "smart_curtain"               // Rideau motorisé
  | "motorized_track"             // Rail motorisé
  | "robot_mower"                 // Tondeuse robot
  | "smart_irrigation"            // Arrosage connecté
  | "smart_pool"                  // Piscine connectée
  | "energy_monitor"              // Moniteur énergie
  
  // ═══════════════════════════════════════════════════════════════════════════
  // SÉCURITÉ - ALARME & VIDÉOSURVEILLANCE
  // ═══════════════════════════════════════════════════════════════════════════
  | "intercom"                    // Interphones
  | "video_intercom"              // Vidéophones
  | "intercom_screen"             // Écran interphone
  | "intercom_outdoor"            // Platine de rue
  | "doorbell"                    // Sonnettes
  | "smart_doorbell"              // Sonnettes connectées
  | "doorbell_camera"             // Sonnette caméra
  | "alarm_panel"                 // Centrales d'alarme
  | "alarm_keypad"                // Clavier d'alarme
  | "alarm_siren"                 // Sirène d'alarme
  | "alarm_siren_outdoor"         // Sirène extérieure
  | "motion_sensor"               // Détecteurs de mouvement
  | "motion_sensor_outdoor"       // Détecteur ext mouvement
  | "pir_sensor"                  // Capteur PIR
  | "glass_break_sensor"          // Détecteur bris de glace
  | "vibration_sensor"            // Détecteur vibration
  | "smoke_detector"              // Détecteurs de fumée
  | "heat_detector"               // Détecteur thermique
  | "co_detector"                 // Détecteur CO
  | "gas_detector"                // Détecteur gaz
  | "flood_detector"              // Détecteur inondation
  | "security_camera"             // Caméras de surveillance
  | "security_camera_indoor"      // Caméra intérieure
  | "security_camera_outdoor"     // Caméra extérieure
  | "security_camera_ptz"         // Caméra motorisée
  | "security_camera_dome"        // Caméra dôme
  | "security_camera_bullet"      // Caméra bullet
  | "security_camera_hidden"      // Caméra discrète
  | "nvr"                         // Enregistreur vidéo
  | "panic_button"                // Bouton panique
  | "security_light"              // Éclairage sécurité
  | "dummy_camera"                // Caméra factice
  
  // ═══════════════════════════════════════════════════════════════════════════
  // ÉNERGIE RENOUVELABLE - SOLAIRE
  // ═══════════════════════════════════════════════════════════════════════════
  | "solar_panel"                 // Panneaux solaires génériques
  | "solar_panel_mono"            // Panneau monocristallin
  | "solar_panel_poly"            // Panneau polycristallin
  | "solar_panel_thin_film"       // Panneau couche mince
  | "solar_panel_bifacial"        // Panneau bifacial
  | "solar_tile"                  // Tuile solaire
  | "solar_roof"                  // Toiture solaire intégrée
  | "building_integrated_pv"      // BIPV
  | "solar_thermal"               // Panneaux solaires thermiques
  | "solar_thermal_flat"          // Capteur plan
  | "solar_thermal_tube"          // Capteur tubes sous vide
  | "solar_mounting"              // Supports panneaux
  | "solar_mounting_roof"         // Fixation toiture
  | "solar_mounting_ground"       // Fixation au sol
  | "solar_carport"               // Ombrière solaire
  | "inverter"                    // Onduleurs
  | "micro_inverter"              // Micro-onduleur
  | "string_inverter"             // Onduleur string
  | "hybrid_inverter"             // Onduleur hybride
  | "battery_storage"             // Batteries de stockage
  | "lithium_battery"             // Batterie lithium
  | "lead_battery"                // Batterie plomb
  | "home_battery"                // Batterie domestique
  | "battery_rack"                // Rack de batteries
  | "solar_optimizer"             // Optimiseur de puissance
  | "solar_monitoring"            // Monitoring solaire
  
  // ═══════════════════════════════════════════════════════════════════════════
  // ÉNERGIE - POMPES À CHALEUR & CLIMATISATION
  // ═══════════════════════════════════════════════════════════════════════════
  | "heat_pump"                   // Pompes à chaleur génériques
  | "heat_pump_air_air"           // PAC air-air
  | "heat_pump_air_water"         // PAC air-eau
  | "heat_pump_ground"            // PAC géothermique
  | "heat_pump_water"             // PAC eau-eau
  | "heat_pump_indoor"            // Unité intérieure PAC
  | "heat_pump_outdoor"           // Unité extérieure PAC
  | "heat_pump_monobloc"          // PAC monobloc
  | "heat_pump_split"             // PAC split
  | "heat_pump_pool"              // PAC piscine
  | "air_conditioning"            // Climatiseurs génériques
  | "ac_split"                    // Climatiseur split
  | "ac_multi_split"              // Multi-split
  | "ac_mono_split"               // Mono-split
  | "ac_wall_unit"                // Unité murale clim
  | "ac_floor_unit"               // Console au sol
  | "ac_ceiling_unit"             // Unité plafond
  | "ac_cassette"                 // Cassette de climatisation
  | "ac_ducted"                   // Climatisation gainable
  | "ac_portable"                 // Climatiseur mobile
  | "ac_window"                   // Climatiseur fenêtre
  | "evaporative_cooler"          // Rafraîchisseur évaporatif
  | "refrigerant_line"            // Liaison frigorifique
  | "condensate_pump"             // Pompe à condensats
  
  // ═══════════════════════════════════════════════════════════════════════════
  // VENTILATION & QUALITÉ D'AIR
  // ═══════════════════════════════════════════════════════════════════════════
  | "ventilation"                 // VMC génériques
  | "vmc_single_flow"             // VMC simple flux
  | "vmc_double_flow"             // VMC double flux
  | "heat_recovery_unit"          // VMC double flux HR
  | "vmc_hygro_a"                 // VMC hygro A
  | "vmc_hygro_b"                 // VMC hygro B
  | "vmc_motor"                   // Caisson VMC
  | "air_inlet"                   // Entrée d'air
  | "exhaust_vent"                // Bouche extraction
  | "supply_vent"                 // Bouche insufflation
  | "adjustable_vent"             // Bouche réglable
  | "duct"                        // Gaine/conduit
  | "duct_insulated"              // Gaine isolée
  | "duct_flexible"               // Gaine souple
  | "duct_rigid"                  // Gaine rigide
  | "ceiling_fan"                 // Ventilateurs de plafond
  | "ceiling_fan_light"           // Ventilateur avec éclairage
  | "exhaust_fan"                 // Extracteur
  | "bathroom_fan"                // Extracteur salle de bain
  | "kitchen_exhaust"             // Extraction cuisine
  | "whole_house_fan"             // Ventilateur maison entière
  | "attic_fan"                   // Ventilateur combles
  | "air_purifier"                // Purificateur d'air
  | "air_purifier_hepa"           // Purificateur HEPA
  | "dehumidifier"                // Déshumidificateurs
  | "humidifier"                  // Humidificateurs
  | "whole_house_humidifier"      // Humidificateur central
  | "fresh_air_system"            // Centrale de traitement d'air
  
  // ═══════════════════════════════════════════════════════════════════════════
  // MOBILITÉ ÉLECTRIQUE
  // ═══════════════════════════════════════════════════════════════════════════
  | "ev_charger"                  // Bornes de recharge VE
  | "ev_charger_wall"             // Wallbox murale
  | "ev_charger_pedestal"         // Borne sur pied
  | "ev_charger_dual"             // Borne double
  | "ev_charger_fast"             // Borne rapide
  | "ev_cable"                    // Câble de recharge
  | "ev_connector"                // Prise type 2
  | "bike_charger"                // Chargeur vélo électrique
  
  // ═══════════════════════════════════════════════════════════════════════════
  // TOITURE - COUVERTURE
  // ═══════════════════════════════════════════════════════════════════════════
  | "roof_tiles"                  // Tuiles génériques
  | "roof_tiles_clay"             // Tuiles terre cuite
  | "roof_tiles_concrete"         // Tuiles béton
  | "roof_tiles_flat"             // Tuiles plates
  | "roof_tiles_roman"            // Tuiles canal/romane
  | "roof_tiles_interlocking"     // Tuiles à emboîtement
  | "roof_tiles_slate_look"       // Tuiles aspect ardoise
  | "slate_roof"                  // Ardoises
  | "slate_natural"               // Ardoise naturelle
  | "slate_fiber_cement"          // Ardoise fibro-ciment
  | "metal_roof"                  // Toiture métallique
  | "metal_roof_standing_seam"    // Toit joint debout
  | "metal_roof_corrugated"       // Tôle ondulée
  | "metal_roof_tiles"            // Tuiles métalliques
  | "zinc_roof"                   // Toiture zinc
  | "copper_roof"                 // Toiture cuivre
  | "aluminum_roof"               // Toiture alu
  | "shingle_roof"                // Bardeaux
  | "shingle_asphalt"             // Bardeaux bitumés
  | "shingle_wood"                // Bardeaux bois
  | "shingle_slate"               // Bardeaux ardoise
  | "flat_roof"                   // Toiture plate
  | "flat_roof_membrane"          // Membrane étanchéité
  | "flat_roof_bitumen"           // Étanchéité bitumineuse
  | "flat_roof_pvc"               // Membrane PVC
  | "flat_roof_epdm"              // Membrane EPDM
  | "flat_roof_gravel"            // Toiture gravillonnée
  | "green_roof"                  // Toiture végétalisée
  | "green_roof_extensive"        // Végétalisation extensive
  | "green_roof_intensive"        // Végétalisation intensive
  | "thatch_roof"                 // Toit de chaume
  | "wood_shingle"                // Tavillons/essentes
  | "polycarbonate_roof"          // Toiture polycarbonate
  | "glass_roof"                  // Toiture vitrée
  
  // ═══════════════════════════════════════════════════════════════════════════
  // TOITURE - ZINGUERIE & ÉVACUATION
  // ═══════════════════════════════════════════════════════════════════════════
  | "gutter"                      // Gouttières
  | "gutter_half_round"           // Gouttière demi-ronde
  | "gutter_square"               // Gouttière carrée
  | "gutter_ogee"                 // Gouttière anglaise
  | "gutter_aluminum"             // Gouttière alu
  | "gutter_zinc"                 // Gouttière zinc
  | "gutter_pvc"                  // Gouttière PVC
  | "gutter_copper"               // Gouttière cuivre
  | "gutter_guard"                // Crapaudine/grille
  | "downspout"                   // Descentes de gouttière
  | "downspout_round"             // Descente ronde
  | "downspout_square"            // Descente carrée
  | "rain_chain"                  // Chaîne de pluie
  | "rain_barrel"                 // Récupérateur eau
  | "fascia"                      // Bandeaux de rive
  | "fascia_board"                // Planche de rive
  | "fascia_aluminum"             // Bandeau alu
  | "soffit"                      // Sous-faces
  | "soffit_vented"               // Sous-face ventilée
  | "soffit_solid"                // Sous-face pleine
  | "bargeboard"                  // Planche de pignon
  | "flashing"                    // Solins
  | "flashing_lead"               // Solin plomb
  | "flashing_zinc"               // Solin zinc
  | "flashing_aluminum"           // Solin alu
  | "step_flashing"               // Noquet
  | "valley_flashing"             // Noue
  | "drip_edge"                   // Larmier
  
  // ═══════════════════════════════════════════════════════════════════════════
  // TOITURE - ÉLÉMENTS & ACCESSOIRES
  // ═══════════════════════════════════════════════════════════════════════════
  | "chimney"                     // Conduits de cheminée
  | "chimney_brick"               // Souche brique
  | "chimney_stone"               // Souche pierre
  | "chimney_prefab"              // Conduit préfabriqué
  | "chimney_metal"               // Conduit métallique
  | "chimney_cap"                 // Chapeaux de cheminée
  | "chimney_pot"                 // Mitron
  | "chimney_cowl"                // Aspirateur statique
  | "chimney_flashing"            // Abergement
  | "ridge"                       // Faîtages
  | "ridge_tile"                  // Tuile faîtière
  | "ridge_vent"                  // Faîtage ventilé
  | "hip_tile"                    // Arêtier
  | "roof_vent"                   // Aérations de toiture
  | "roof_vent_tile"              // Tuile à douille
  | "turbine_vent"                // Extracteur éolien
  | "static_vent"                 // Chatière
  | "antenna"                     // Antennes
  | "antenna_tv"                  // Antenne TV
  | "antenna_5g"                  // Antenne mobile
  | "satellite_dish"              // Paraboles
  | "lightning_rod"               // Paratonnerre
  | "snow_guard"                  // Arrêt de neige
  | "roof_walk"                   // Passerelle de toit
  | "roof_anchor"                 // Point d'ancrage
  | "roof_hatch"                  // Trappe de toit
  | "smoke_vent"                  // Exutoire de fumée
  
  // ═══════════════════════════════════════════════════════════════════════════
  // FAÇADE - REVÊTEMENTS
  // ═══════════════════════════════════════════════════════════════════════════
  | "render"                      // Enduit générique
  | "render_smooth"               // Enduit lisse
  | "render_textured"             // Enduit gratté
  | "render_rough_cast"           // Enduit tyrolien
  | "render_pebble_dash"          // Crépi projeté
  | "render_lime"                 // Enduit à la chaux
  | "render_monocouche"           // Enduit monocouche
  | "cladding"                    // Bardage générique
  | "wood_cladding"               // Bardage bois
  | "wood_cladding_horizontal"    // Bardage horizontal
  | "wood_cladding_vertical"      // Bardage vertical
  | "wood_cladding_diagonal"      // Bardage diagonal
  | "wood_cladding_shingle"       // Bardage écailles
  | "composite_cladding"          // Bardage composite
  | "fiber_cement_cladding"       // Bardage fibro-ciment
  | "metal_cladding"              // Bardage métallique
  | "aluminum_cladding"           // Bardage alu
  | "zinc_cladding"               // Bardage zinc
  | "copper_cladding"             // Bardage cuivre
  | "corrugated_cladding"         // Bardage ondulé
  | "cassette_cladding"           // Bardage cassettes
  | "terracotta_cladding"         // Bardage terre cuite
  | "stone_cladding"              // Parement pierre
  | "natural_stone_facade"        // Pierre naturelle
  | "cut_stone"                   // Pierre de taille
  | "stone_veneer"                // Parement pierre reconstituée
  | "brick_facade"                // Façade brique
  | "brick_slip"                  // Plaquettes de brique
  | "face_brick"                  // Brique de parement
  | "glass_facade"                // Façade verre
  | "curtain_wall"                // Mur-rideau
  | "external_insulation"         // ITE système
  | "ite_eps"                     // ITE polystyrène
  | "ite_mineral_wool"            // ITE laine minérale
  | "ite_wood_fiber"              // ITE fibre de bois
  | "rainscreen"                  // Façade ventilée
  
  // ═══════════════════════════════════════════════════════════════════════════
  // FAÇADE - ÉLÉMENTS
  // ═══════════════════════════════════════════════════════════════════════════
  | "window_sill"                 // Appuis de fenêtre
  | "window_sill_stone"           // Appui pierre
  | "window_sill_concrete"        // Appui béton
  | "window_sill_aluminum"        // Appui alu
  | "window_sill_tile"            // Appui carrelage
  | "window_lintel"               // Linteau fenêtre
  | "window_surround"             // Encadrement fenêtre
  | "cornice"                     // Corniches extérieures
  | "cornice_stone"               // Corniche pierre
  | "cornice_polystyrene"         // Corniche polystyrène
  | "string_course"               // Bandeau de façade
  | "quoin"                       // Chaînage d'angle
  | "balcony"                     // Balcons
  | "balcony_steel"               // Balcon acier
  | "balcony_concrete"            // Balcon béton
  | "balcony_glass"               // Balcon verre
  | "juliet_balcony"              // Garde-corps fenêtre
  | "loggia"                      // Loggias
  | "bay_window_facade"           // Oriel
  | "external_stair"              // Escalier extérieur
  | "external_ramp"               // Rampe extérieure
  | "house_number"                // Numéros de maison
  | "house_name_sign"             // Plaque nom maison
  | "mailbox"                     // Boîtes aux lettres
  | "mailbox_wall"                // BAL encastrée
  | "mailbox_pedestal"            // BAL sur pied
  | "parcel_box"                  // Boîte à colis
  | "doormat"                     // Paillasson
  | "boot_scraper"                // Gratte-pieds
  | "exterior_tap"                // Robinet extérieur
  | "hose_reel"                   // Dévidoir
  
  // ═══════════════════════════════════════════════════════════════════════════
  // AMÉNAGEMENT EXTÉRIEUR - TERRASSES
  // ═══════════════════════════════════════════════════════════════════════════
  | "terrace"                     // Terrasses génériques
  | "wooden_deck"                 // Terrasses bois
  | "deck_exotic"                 // Bois exotique
  | "deck_softwood"               // Bois résineux traité
  | "deck_thermo"                 // Bois thermo-traité
  | "composite_deck"              // Terrasses composite
  | "stone_terrace"               // Terrasses pierre
  | "stone_terrace_natural"       // Pierre naturelle
  | "stone_terrace_reconstituted" // Pierre reconstituée
  | "tile_terrace"                // Terrasse carrelée
  | "porcelain_paver"             // Dalles grès cérame
  | "concrete_terrace"            // Terrasse béton
  | "concrete_stamped"            // Béton imprimé
  | "concrete_brushed"            // Béton brossé
  | "concrete_polished"           // Béton poli
  | "concrete_washed"             // Béton lavé
  | "concrete_colored"            // Béton coloré
  | "resin_bound"                 // Résine/moquette de pierre
  | "patio"                       // Patios
  | "deck_tile"                   // Caillebotis/dalle terrasse
  | "deck_pedestal"               // Plot terrasse
  | "deck_joist"                  // Lambourde terrasse
  | "deck_railing"                // Garde-corps terrasse
  | "deck_stair"                  // Escalier terrasse
  | "deck_lighting"               // Éclairage terrasse
  | "deck_planter"                // Bac à fleurs terrasse
  | "outdoor_rug"                 // Tapis d'extérieur
  
  // ═══════════════════════════════════════════════════════════════════════════
  // AMÉNAGEMENT EXTÉRIEUR - ALLÉES & SOLS
  // ═══════════════════════════════════════════════════════════════════════════
  | "pathway"                     // Allées piétonnes
  | "driveway"                    // Allées carrossables
  | "gravel_path"                 // Allées en gravier
  | "gravel_stabilized"           // Gravier stabilisé
  | "gravel_decorative"           // Gravier décoratif
  | "paving"                      // Dallages génériques
  | "paving_stone"                // Dalles pierre
  | "paving_concrete"             // Dalles béton
  | "paving_porcelain"            // Dalles céramique ext
  | "paving_slab"                 // Dalle XXL
  | "cobblestone"                 // Pavés
  | "cobblestone_granite"         // Pavés granit
  | "cobblestone_concrete"        // Pavés béton
  | "cobblestone_sandstone"       // Pavés grès
  | "brick_paving"                // Pavés briques
  | "permeable_paving"            // Pavés perméables
  | "grass_paving"                // Dalles gazon
  | "stepping_stone"              // Pas japonais
  | "decomposed_granite"          // Sable stabilisé
  | "bark_mulch_path"             // Allée paillage
  | "edging"                      // Bordures génériques
  | "edging_stone"                // Bordure pierre
  | "edging_concrete"             // Bordure béton
  | "edging_steel"                // Bordure acier
  | "edging_alu"                  // Bordure alu
  | "edging_plastic"              // Bordure plastique
  | "edging_wood"                 // Bordure bois
  | "curb"                        // Caniveau
  | "channel_drain"               // Caniveau à grille
  | "parking_bumper"              // Butée de parking
  | "parking_marker"              // Marquage parking
  
  // ═══════════════════════════════════════════════════════════════════════════
  // AMÉNAGEMENT EXTÉRIEUR - MURS & SOUTÈNEMENT
  // ═══════════════════════════════════════════════════════════════════════════
  | "lawn"                        // Pelouses
  | "lawn_seed"                   // Gazon semé
  | "lawn_roll"                   // Gazon en rouleau
  | "artificial_grass"            // Gazon synthétique
  | "ground_cover"                // Couvre-sols
  | "mulch"                       // Paillage
  | "bark_mulch"                  // Écorces
  | "wood_chip_mulch"             // Copeaux de bois
  | "mineral_mulch"               // Paillage minéral
  | "flower_bed"                  // Massifs floraux
  | "border"                      // Bordures végétales
  | "retaining_wall"              // Murs de soutènement
  | "retaining_wall_concrete"     // Soutènement béton
  | "retaining_wall_stone"        // Soutènement pierre
  | "retaining_wall_wood"         // Soutènement bois
  | "gabion_wall"                 // Gabions
  | "crib_wall"                   // Mur caisson
  | "boulder_wall"                // Enrochement
  | "garden_wall"                 // Murets de jardin
  | "dry_stone_wall"              // Mur pierre sèche
  | "raised_bed"                  // Bacs surélevés/carrés potager
  | "raised_planter"              // Jardinière surélevée
  | "terracing"                   // Terrasses étagées
  | "slope_stabilization"         // Stabilisation pente
  
  // ═══════════════════════════════════════════════════════════════════════════
  // VÉGÉTATION - ARBRES
  // ═══════════════════════════════════════════════════════════════════════════
  | "tree"                        // Arbres génériques
  | "deciduous_tree"              // Arbre caduc
  | "evergreen_tree"              // Arbre persistant
  | "conifer"                     // Conifère
  | "fruit_tree"                  // Arbres fruitiers
  | "apple_tree"                  // Pommier
  | "cherry_tree"                 // Cerisier
  | "pear_tree"                   // Poirier
  | "plum_tree"                   // Prunier
  | "fig_tree"                    // Figuier
  | "olive_tree"                  // Olivier
  | "citrus_tree"                 // Agrume
  | "palm_tree"                   // Palmiers
  | "date_palm"                   // Dattier
  | "fan_palm"                    // Palmier éventail
  | "ornamental_tree"             // Arbre d'ornement
  | "flowering_tree"              // Arbre à fleurs
  | "japanese_maple"              // Érable japonais
  | "birch"                       // Bouleau
  | "oak"                         // Chêne
  | "beech"                       // Hêtre
  | "willow"                      // Saule
  | "magnolia"                    // Magnolia
  | "pine"                        // Pin
  | "cypress"                     // Cyprès
  | "cedar"                       // Cèdre
  | "tree_espalier"               // Arbre palissé
  | "topiary_tree"                // Arbre topiaire
  | "multi_stem_tree"             // Arbre multi-troncs
  | "standard_tree"               // Arbre tige
  | "half_standard"               // Arbre demi-tige
  | "columnar_tree"               // Arbre fastigié
  | "weeping_tree"                // Arbre pleureur
  
  // ═══════════════════════════════════════════════════════════════════════════
  // VÉGÉTATION - ARBUSTES & HAIES
  // ═══════════════════════════════════════════════════════════════════════════
  | "shrub"                       // Arbustes génériques
  | "flowering_shrub"             // Arbuste à fleurs
  | "evergreen_shrub"             // Arbuste persistant
  | "deciduous_shrub"             // Arbuste caduc
  | "rose_bush"                   // Rosier
  | "rose_climbing"               // Rosier grimpant
  | "rose_bush_shrub"             // Rosier arbustif
  | "hydrangea"                   // Hortensia
  | "lavender"                    // Lavande
  | "boxwood"                     // Buis
  | "privet"                      // Troène
  | "laurel"                      // Laurier
  | "photinia"                    // Photinia
  | "viburnum"                    // Viorne
  | "forsythia"                   // Forsythia
  | "rhododendron"                // Rhododendron
  | "azalea"                      // Azalée
  | "camellia"                    // Camélia
  | "hedge"                       // Haies
  | "hedge_formal"                // Haie taillée
  | "hedge_informal"              // Haie libre
  | "hedge_mixed"                 // Haie champêtre
  | "hedge_evergreen"             // Haie persistante
  | "hedge_flowering"             // Haie fleurie
  | "thuja_hedge"                 // Haie thuyas
  | "cypress_hedge"               // Haie cyprès
  | "beech_hedge"                 // Haie hêtre
  | "bamboo_screen"               // Brise-vue bambou
  | "living_fence"                // Haie palissée
  
  // ═══════════════════════════════════════════════════════════════════════════
  // VÉGÉTATION - PLANTES & FLEURS
  // ═══════════════════════════════════════════════════════════════════════════
  | "climbing_plant"              // Plantes grimpantes
  | "wisteria"                    // Glycine
  | "jasmine"                     // Jasmin
  | "ivy"                         // Lierre
  | "virginia_creeper"            // Vigne vierge
  | "clematis"                    // Clématite
  | "honeysuckle"                 // Chèvrefeuille
  | "bougainvillea"               // Bougainvillée
  | "flower"                      // Fleurs génériques
  | "perennial"                   // Vivace
  | "annual"                      // Annuelle
  | "bulb"                        // Bulbe
  | "tulip"                       // Tulipe
  | "daffodil"                    // Narcisse/jonquille
  | "dahlia"                      // Dahlia
  | "peony"                       // Pivoine
  | "iris"                        // Iris
  | "lily"                        // Lis
  | "geranium"                    // Géranium
  | "petunia"                     // Pétunia
  | "ornamental_grass"            // Graminées
  | "pampas_grass"                // Herbe de la pampa
  | "miscanthus"                  // Miscanthus
  | "bamboo"                      // Bambou
  | "fern"                        // Fougère
  | "hosta"                       // Hosta
  | "succulent"                   // Succulente
  | "cactus"                      // Cactus
  | "aromatic_plant"              // Aromatique
  | "herb_garden"                 // Carré d'herbes
  | "vegetable_garden"            // Potager
  | "raised_vegetable"            // Carré potager
  
  // ═══════════════════════════════════════════════════════════════════════════
  // VÉGÉTATION - INTÉRIEUR & POTS
  // ═══════════════════════════════════════════════════════════════════════════
  | "indoor_plant"                // Plantes d'intérieur
  | "fiddle_leaf_fig"             // Ficus lyrata
  | "monstera"                    // Monstera
  | "snake_plant"                 // Sansevieria
  | "pothos"                      // Pothos
  | "philodendron"                // Philodendron
  | "rubber_plant"                // Ficus elastica
  | "peace_lily"                  // Spathiphyllum
  | "zz_plant"                    // Zamioculcas
  | "dracaena"                    // Dracaena
  | "palm_indoor"                 // Palmier intérieur
  | "bonsai"                      // Bonsaï
  | "orchid"                      // Orchidée
  | "potted_plant"                // Plantes en pot ext
  | "large_planter"               // Grand bac à plantes
  | "window_box"                  // Jardinière de fenêtre
  | "hanging_plant"               // Plantes suspendues
  | "hanging_basket"              // Suspension/panier
  | "macrame_hanger"              // Macramé
  | "planter"                     // Jardinières
  | "planter_ceramic"             // Pot céramique
  | "planter_terracotta"          // Pot terre cuite
  | "planter_concrete"            // Pot béton
  | "planter_metal"               // Pot métal
  | "planter_plastic"             // Pot plastique
  | "planter_wicker"              // Cache-pot osier
  | "plant_stand"                 // Support plante
  | "plant_shelf"                 // Étagère à plantes
  | "vertical_garden"             // Murs végétaux
  | "living_wall"                 // Mur vivant
  | "moss_wall"                   // Mur de mousse
  | "artificial_plant"            // Plante artificielle
  
  // ═══════════════════════════════════════════════════════════════════════════
  // PISCINE & BASSIN
  // ═══════════════════════════════════════════════════════════════════════════
  | "swimming_pool"               // Piscines enterrées
  | "pool_concrete"               // Piscine béton
  | "pool_liner"                  // Piscine liner
  | "pool_shell"                  // Piscine coque
  | "pool_stainless"              // Piscine inox
  | "pool_monoblock"              // Piscine monobloc
  | "pool_infinity"               // Piscine à débordement
  | "pool_rectangular"            // Piscine rectangulaire
  | "pool_freeform"               // Piscine forme libre
  | "pool_lap"                    // Couloir de nage
  | "pool_mini"                   // Mini piscine
  | "above_ground_pool"           // Piscines hors-sol
  | "pool_steel_wall"             // Piscine acier
  | "pool_wood_frame"             // Piscine bois
  | "pool_inflatable"             // Piscine gonflable
  | "pool_frame"                  // Piscine tubulaire
  | "natural_pool"                // Piscines naturelles
  | "biopool"                     // Baignade biologique
  | "pond_swim"                   // Étang de baignade
  | "pool_liner_material"         // Revêtement piscine
  | "pool_mosaic"                 // Mosaïque piscine
  | "pool_paint"                  // Peinture piscine
  | "pool_membrane"               // Membrane armée
  | "pool_coping"                 // Margelles
  | "pool_coping_stone"           // Margelles pierre
  | "pool_coping_concrete"        // Margelles béton
  | "pool_coping_wood"            // Margelles bois
  | "pool_deck"                   // Plages de piscine
  | "pool_surround"               // Abords piscine
  | "pool_ladder"                 // Échelle piscine
  | "pool_stair"                  // Escalier piscine
  | "pool_stair_roman"            // Escalier roman
  | "pool_rail"                   // Main courante piscine
  | "pool_cover"                  // Couvertures piscine
  | "pool_cover_manual"           // Bâche manuelle
  | "pool_cover_automatic"        // Volet automatique
  | "pool_cover_solar"            // Bâche à bulles
  | "pool_cover_winter"           // Bâche hiver
  | "pool_cover_safety"           // Couverture sécurité
  | "pool_enclosure"              // Abris de piscine
  | "pool_enclosure_low"          // Abri bas
  | "pool_enclosure_mid"          // Abri mi-haut
  | "pool_enclosure_high"         // Abri haut
  | "pool_enclosure_telescopic"   // Abri télescopique
  | "pool_dome"                   // Dôme piscine
  | "pool_house"                  // Pool house
  | "pool_cabana"                 // Cabane piscine
  
  // ═══════════════════════════════════════════════════════════════════════════
  // ÉQUIPEMENTS PISCINE
  // ═══════════════════════════════════════════════════════════════════════════
  | "pool_pump"                   // Pompe piscine
  | "pool_filter"                 // Filtre piscine
  | "pool_filter_sand"            // Filtre à sable
  | "pool_filter_cartridge"       // Filtre à cartouche
  | "pool_filter_de"              // Filtre diatomées
  | "pool_heater"                 // Chauffage piscine
  | "pool_heat_pump"              // PAC piscine
  | "pool_solar_heater"           // Chauffage solaire piscine
  | "pool_exchanger"              // Échangeur thermique
  | "pool_chlorinator"            // Électrolyseur
  | "pool_salt_system"            // Traitement au sel
  | "pool_ph_regulator"           // Régulateur pH
  | "pool_robot"                  // Robot piscine
  | "pool_cleaner"                // Nettoyeur automatique
  | "pool_skimmer"                // Skimmer
  | "pool_inlet"                  // Buse de refoulement
  | "pool_drain"                  // Bonde de fond
  | "pool_jet"                    // Jet de massage
  | "pool_nage_contre_courant"    // Nage contre-courant
  | "diving_board"                // Plongeoir
  | "pool_slide"                  // Toboggan piscine
  | "pool_fountain"               // Fontaine piscine
  | "pool_waterfall"              // Cascade piscine
  | "pool_light"                  // Projecteur piscine
  | "pool_light_led"              // LED piscine
  | "pool_alarm"                  // Alarme piscine
  | "pool_fence"                  // Clôture piscine
  | "pool_shower"                 // Douche piscine
  | "pool_foot_bath"              // Pédiluve
  
  // ═══════════════════════════════════════════════════════════════════════════
  // SPA & WELLNESS
  // ═══════════════════════════════════════════════════════════════════════════
  | "spa"                         // Spas génériques
  | "hot_tub"                     // Jacuzzis
  | "hot_tub_portable"            // Spa portable
  | "hot_tub_inflatable"          // Spa gonflable
  | "hot_tub_built_in"            // Spa encastré
  | "swim_spa"                    // Spa de nage
  | "sauna"                       // Saunas
  | "sauna_traditional"           // Sauna traditionnel
  | "sauna_infrared"              // Sauna infrarouge
  | "sauna_barrel"                // Sauna tonneau
  | "sauna_outdoor"               // Sauna extérieur
  | "steam_room"                  // Hammam
  | "cold_plunge"                 // Bain froid
  | "hot_tub_cover"               // Couverture spa
  | "spa_steps"                   // Marches spa
  
  // ═══════════════════════════════════════════════════════════════════════════
  // BASSINS & FONTAINES
  // ═══════════════════════════════════════════════════════════════════════════
  | "pond"                        // Bassins
  | "koi_pond"                    // Bassin koï
  | "wildlife_pond"               // Mare naturelle
  | "formal_pond"                 // Bassin formel
  | "raised_pond"                 // Bassin surélevé
  | "pond_liner"                  // Bâche bassin
  | "pond_preform"                // Bassin préformé
  | "pond_pump"                   // Pompe bassin
  | "pond_filter"                 // Filtre bassin
  | "pond_aerator"                // Aérateur
  | "pond_uv"                     // Stérilisateur UV
  | "fountain"                    // Fontaines
  | "wall_fountain"               // Fontaine murale
  | "tiered_fountain"             // Fontaine à étages
  | "fountain_modern"             // Fontaine moderne
  | "fountain_classic"            // Fontaine classique
  | "fountain_sphere"             // Boule fontaine
  | "bubble_fountain"             // Fontaine à bulle
  | "waterfall"                   // Cascades
  | "stream"                      // Ruisseau
  | "water_feature"               // Jeu d'eau
  | "birdbath"                    // Bain d'oiseaux
  
  // ═══════════════════════════════════════════════════════════════════════════
  // ARROSAGE & IRRIGATION
  // ═══════════════════════════════════════════════════════════════════════════
  | "irrigation_system"           // Système d'arrosage
  | "sprinkler"                   // Arroseur
  | "sprinkler_popup"             // Arroseur escamotable
  | "sprinkler_rotor"             // Arroseur rotatif
  | "sprinkler_spray"             // Arroseur fixe
  | "drip_irrigation"             // Goutte à goutte
  | "soaker_hose"                 // Tuyau poreux
  | "irrigation_controller"       // Programmateur
  | "smart_irrigation"            // Arrosage connecté
  | "rain_sensor"                 // Capteur de pluie
  | "soil_moisture_sensor"        // Capteur humidité sol
  | "garden_hose"                 // Tuyau d'arrosage
  | "hose_reel_mount"             // Dévidoir mural
  | "hose_cart"                   // Chariot dévidoir
  | "watering_can"                // Arrosoir
  | "water_tank"                  // Cuve de récupération
  | "rain_barrel_garden"          // Tonneau récupération
  
  // ═══════════════════════════════════════════════════════════════════════════
  // MOBILIER EXTÉRIEUR
  // ═══════════════════════════════════════════════════════════════════════════
  | "outdoor_sofa"                // Canapés d'extérieur
  | "outdoor_sofa_modular"        // Canapé modulable ext
  | "outdoor_sofa_corner"         // Canapé angle ext
  | "outdoor_armchair"            // Fauteuil extérieur
  | "outdoor_chair"               // Chaises de jardin
  | "outdoor_chair_folding"       // Chaise pliante
  | "outdoor_chair_stacking"      // Chaise empilable
  | "adirondack_chair"            // Chaise Adirondack
  | "outdoor_dining_chair"        // Chaise repas ext
  | "outdoor_table"               // Tables de jardin
  | "outdoor_dining_table"        // Table repas ext
  | "outdoor_coffee_table"        // Table basse ext
  | "outdoor_side_table"          // Table appoint ext
  | "picnic_table"                // Table pique-nique
  | "bistro_set"                  // Set bistrot
  | "sun_lounger"                 // Bains de soleil
  | "lounger_reclining"           // Transat inclinable
  | "lounger_double"              // Bain de soleil double
  | "lounger_wicker"              // Transat résine
  | "daybed_outdoor"              // Lit de jardin
  | "hammock"                     // Hamacs
  | "hammock_stand"               // Support hamac
  | "hammock_chair"               // Chaise hamac
  | "porch_swing"                 // Balancelle
  | "egg_chair_outdoor"           // Fauteuil œuf suspendu
  | "parasol"                     // Parasols
  | "parasol_center"              // Parasol central
  | "parasol_cantilever"          // Parasol déporté
  | "parasol_wall"                // Parasol mural
  | "parasol_base"                // Pied de parasol
  | "outdoor_cushion"             // Coussins d'extérieur
  | "outdoor_pillow"              // Oreiller extérieur
  | "bbq"                         // Barbecues génériques
  | "bbq_charcoal"                // Barbecue charbon
  | "bbq_gas"                     // Barbecue gaz
  | "bbq_electric"                // Barbecue électrique
  | "bbq_kamado"                  // Kamado
  | "bbq_smoker"                  // Fumoir
  | "bbq_built_in"                // Barbecue encastré
  | "plancha"                     // Plancha
  | "pizza_oven"                  // Four à pizza
  | "outdoor_kitchen"             // Cuisines d'été
  | "outdoor_sink"                // Évier extérieur
  | "outdoor_fridge"              // Réfrigérateur ext
  | "outdoor_bar"                 // Bar extérieur
  | "fire_pit"                    // Braseros
  | "fire_pit_round"              // Brasero rond
  | "fire_pit_square"             // Brasero carré
  | "fire_pit_table"              // Table brasero
  | "fire_bowl"                   // Coupe à feu
  | "chiminea"                    // Cheminée mexicaine
  | "outdoor_heater"              // Chauffages extérieurs
  | "patio_heater"                // Parasol chauffant
  | "wall_heater_ext"             // Chauffage mural ext
  | "tabletop_heater"             // Chauffage table
  | "garden_shed"                 // Abris de jardin
  | "tool_shed"                   // Cabane à outils
  | "log_store"                   // Abri bûches
  | "bike_shed"                   // Abri vélos
  | "bin_store"                   // Abri poubelles
  | "greenhouse"                  // Serres de jardin
  | "cold_frame_garden"           // Châssis jardin
  | "potting_bench"               // Table de rempotage
  | "compost_bin"                 // Composteur
  | "playground"                  // Aires de jeux
  | "swing_set"                   // Portique balançoire
  | "swing"                       // Balançoire simple
  | "slide"                       // Toboggan
  | "climbing_frame"              // Structure escalade
  | "sandbox"                     // Bac à sable
  | "playhouse"                   // Cabane enfants
  | "trampoline"                  // Trampolines
  | "trampoline_inground"         // Trampoline enterré
  | "basketball_hoop"             // Panier basket
  | "outdoor_games"               // Jeux extérieurs
  
  // ═══════════════════════════════════════════════════════════════════════════
  // DÉCORATION INTÉRIEURE - ART & ACCESSOIRES
  // ═══════════════════════════════════════════════════════════════════════════
  | "painting"                    // Tableaux
  | "painting_oil"                // Peinture huile
  | "painting_acrylic"            // Peinture acrylique
  | "painting_watercolor"         // Aquarelle
  | "painting_abstract"           // Tableau abstrait
  | "framed_art"                  // Œuvres encadrées
  | "canvas_print"                // Impression sur toile
  | "poster"                      // Posters
  | "art_print"                   // Reproduction d'art
  | "photography_art"             // Photo d'art
  | "wall_art"                    // Art mural général
  | "gallery_wall"                // Mur de cadres
  | "metal_wall_art"              // Décor mural métal
  | "wood_wall_art"               // Décor mural bois
  | "textile_wall_art"            // Tapisserie murale
  | "macrame_wall"                // Macramé mural
  | "woven_wall"                  // Tissage mural
  | "mirror"                      // Miroirs génériques
  | "mirror_round"                // Miroir rond
  | "mirror_rectangular"          // Miroir rectangulaire
  | "mirror_arched"               // Miroir arche
  | "mirror_sunburst"             // Miroir soleil
  | "mirror_floor"                // Miroir sur pied
  | "mirror_leaning"              // Miroir à poser
  | "decorative_mirror"           // Miroir décoratif
  | "clock"                       // Horloges génériques
  | "wall_clock"                  // Pendules murales
  | "mantel_clock"                // Horloge de cheminée
  | "grandfather_clock"           // Horloge comtoise
  | "cuckoo_clock"                // Coucou
  | "alarm_clock"                 // Réveil
  | "vase"                        // Vases
  | "vase_floor"                  // Vase de sol
  | "vase_table"                  // Vase de table
  | "vase_bud"                    // Soliflore
  | "sculpture"                   // Sculptures
  | "sculpture_abstract"          // Sculpture abstraite
  | "bust"                        // Buste
  | "figurine"                    // Figurines
  | "statue"                      // Statue
  | "decorative_object"           // Objet décoratif
  | "candle"                      // Bougies
  | "pillar_candle"               // Bougie pilier
  | "taper_candle"                // Bougie chandelle
  | "votive_candle"               // Bougie votive
  | "candle_holder"               // Bougeoirs
  | "candlestick"                 // Chandelier
  | "candelabra"                  // Candélabre
  | "lantern_decor"               // Lanterne déco
  | "diffuser"                    // Diffuseur parfum
  | "incense_holder"              // Porte-encens
  | "photo_frame"                 // Cadres photo
  | "picture_ledge"               // Étagère photos
  | "decorative_bowl"             // Coupe décorative
  | "decorative_tray"             // Plateau décoratif
  | "decorative_box"              // Boîte décorative
  | "bookends"                    // Serre-livres
  | "globe"                       // Globe terrestre
  | "hourglass"                   // Sablier
  | "terrarium"                   // Terrarium
  | "aquarium"                    // Aquarium
  
  // ═══════════════════════════════════════════════════════════════════════════
  // TEXTILES D'INTÉRIEUR
  // ═══════════════════════════════════════════════════════════════════════════
  | "curtain"                     // Rideaux
  | "curtain_blackout"            // Rideau occultant
  | "curtain_thermal"             // Rideau thermique
  | "curtain_linen"               // Rideau lin
  | "curtain_velvet"              // Rideau velours
  | "sheer_curtain"               // Voilages
  | "drape"                       // Doubles rideaux
  | "curtain_rod"                 // Tringle à rideau
  | "curtain_finial"              // Embout de tringle
  | "curtain_ring"                // Anneau de rideau
  | "curtain_tieback"             // Embrasse
  | "curtain_holdback"            // Patère embrasse
  | "roman_shade"                 // Stores romains
  | "roller_shade"                // Stores enrouleurs
  | "rug"                         // Tapis génériques
  | "rug_wool"                    // Tapis laine
  | "rug_cotton"                  // Tapis coton
  | "rug_jute"                    // Tapis jute
  | "rug_silk"                    // Tapis soie
  | "rug_synthetic"               // Tapis synthétique
  | "rug_round"                   // Tapis rond
  | "rug_rectangular"             // Tapis rectangulaire
  | "rug_runner"                  // Tapis couloir
  | "rug_area"                    // Tapis de zone
  | "rug_shag"                    // Tapis à poils longs
  | "rug_flatweave"               // Tapis tissé plat
  | "rug_persian"                 // Tapis persan
  | "rug_moroccan"                // Tapis berbère
  | "rug_outdoor"                 // Tapis extérieur
  | "rug_pad"                     // Sous-tapis antidérapant
  | "carpet"                      // Moquettes
  | "carpet_tiles"                // Dalles moquette
  | "runner"                      // Chemin de couloir
  | "stair_runner"                // Tapis d'escalier
  | "doormat_interior"            // Tapis d'entrée
  | "bath_rug"                    // Tapis de bain
  | "cushion"                     // Coussins
  | "throw_pillow"                // Coussin décoratif
  | "floor_cushion"               // Coussin de sol
  | "bolster"                     // Traversin déco
  | "throw"                       // Plaids
  | "throw_blanket"               // Couverture décorative
  | "bedding"                     // Linge de lit
  | "duvet_cover"                 // Housse de couette
  | "comforter"                   // Édredon
  | "quilt"                       // Courtepointe
  | "bed_skirt"                   // Cache-sommier
  | "pillow_sham"                 // Taie décorative
  | "bed_scarf"                   // Chemin de lit
  | "towel"                       // Serviettes
  | "bath_towel"                  // Serviette de bain
  | "hand_towel"                  // Serviette mains
  | "guest_towel"                 // Serviette invité
  | "tablecloth"                  // Nappes
  | "table_runner"                // Chemin de table
  | "placemat"                    // Set de table
  | "napkin"                      // Serviette de table
  
  // ═══════════════════════════════════════════════════════════════════════════
  // CUISINE - MOBILIER & AGENCEMENT
  // ═══════════════════════════════════════════════════════════════════════════
  | "kitchen_cabinet"             // Meubles de cuisine génériques
  | "upper_cabinet"               // Meubles hauts
  | "upper_cabinet_glass"         // Meuble haut vitré
  | "upper_cabinet_open"          // Étagère murale cuisine
  | "base_cabinet"                // Meubles bas
  | "base_cabinet_drawer"         // Meuble tiroirs
  | "base_cabinet_door"           // Meuble portes
  | "corner_cabinet"              // Meuble d'angle
  | "tall_cabinet"                // Colonne de rangement
  | "pantry_cabinet"              // Garde-manger
  | "appliance_garage"            // Garage électroménager
  | "countertop"                  // Plans de travail
  | "countertop_granite"          // Plan granit
  | "countertop_quartz"           // Plan quartz
  | "countertop_marble"           // Plan marbre
  | "countertop_wood"             // Plan bois massif
  | "countertop_laminate"         // Plan stratifié
  | "countertop_stainless"        // Plan inox
  | "countertop_concrete"         // Plan béton
  | "countertop_ceramic"          // Plan céramique
  | "countertop_solid_surface"    // Plan Corian
  | "countertop_dekton"           // Plan Dekton
  | "kitchen_island"              // Îlots de cuisine
  | "island_with_seating"         // Îlot avec coin repas
  | "island_with_sink"            // Îlot avec évier
  | "island_with_cooktop"         // Îlot avec cuisson
  | "peninsula"                   // Presqu'île
  | "breakfast_bar"               // Bar petit-déjeuner
  | "backsplash"                  // Crédences
  | "backsplash_tile"             // Crédence carrelage
  | "backsplash_glass"            // Crédence verre
  | "backsplash_stainless"        // Crédence inox
  | "backsplash_stone"            // Crédence pierre
  | "cabinet_hardware"            // Poignées/boutons
  | "cabinet_pull"                // Tirette
  | "cabinet_knob"                // Bouton de meuble
  | "cabinet_hinge"               // Charnière
  | "soft_close"                  // Fermeture douce
  | "drawer_organizer"            // Organiseur tiroir
  | "pull_out_shelf"              // Plateau coulissant
  | "lazy_susan"                  // Plateau tournant
  | "spice_rack"                  // Range-épices
  | "wine_rack_kitchen"           // Casier à vin cuisine
  | "plate_rack"                  // Égouttoir mural
  | "pot_rail"                    // Barre ustensiles
  | "knife_block"                 // Bloc couteaux
  
  // ═══════════════════════════════════════════════════════════════════════════
  // CUISINE - GROS ÉLECTROMÉNAGER
  // ═══════════════════════════════════════════════════════════════════════════
  | "range_hood"                  // Hottes génériques
  | "range_hood_wall"             // Hotte murale
  | "range_hood_island"           // Hotte îlot
  | "range_hood_ceiling"          // Hotte plafond
  | "range_hood_integrated"       // Hotte intégrée
  | "range_hood_downdraft"        // Hotte escamotable
  | "refrigerator"                // Réfrigérateurs
  | "refrigerator_french_door"    // Réfrigérateur américain
  | "refrigerator_side_by_side"   // Réfrigérateur double porte
  | "refrigerator_top_freezer"    // Réfrigérateur congélateur haut
  | "refrigerator_bottom_freezer" // Réfrigérateur congélateur bas
  | "refrigerator_built_in"       // Réfrigérateur encastrable
  | "refrigerator_column"         // Colonne réfrigérateur
  | "refrigerator_under_counter"  // Réfrigérateur sous plan
  | "freezer"                     // Congélateurs
  | "freezer_chest"               // Congélateur coffre
  | "freezer_upright"             // Congélateur armoire
  | "oven"                        // Fours génériques
  | "oven_single"                 // Four simple
  | "oven_double"                 // Double four
  | "oven_wall"                   // Four mural
  | "oven_steam"                  // Four vapeur
  | "oven_combi"                  // Four combiné
  | "oven_pyrolytic"              // Four pyrolyse
  | "built_in_oven"               // Four encastrable
  | "range_cooker"                // Piano de cuisson
  | "cooktop"                     // Plaques de cuisson
  | "cooktop_induction"           // Plaque induction
  | "cooktop_gas"                 // Plaque gaz
  | "cooktop_ceramic"             // Plaque vitrocéramique
  | "cooktop_mixed"               // Plaque mixte
  | "cooktop_domino"              // Domino
  | "cooktop_teppanyaki"          // Teppanyaki
  | "cooktop_wok"                 // Wok
  | "cooktop_grill"               // Gril
  | "cooktop_fryer"               // Friteuse intégrée
  | "microwave"                   // Micro-ondes
  | "microwave_built_in"          // Micro-ondes encastrable
  | "microwave_drawer"            // Micro-ondes tiroir
  | "dishwasher"                  // Lave-vaisselle
  | "dishwasher_built_in"         // Lave-vaisselle encastrable
  | "dishwasher_freestanding"     // Lave-vaisselle pose libre
  | "dishwasher_compact"          // Lave-vaisselle compact
  | "dishwasher_drawer"           // Lave-vaisselle tiroir
  | "wine_cooler"                 // Caves à vin
  | "wine_cooler_built_in"        // Cave à vin intégrée
  | "wine_cooler_freestanding"    // Cave à vin pose libre
  | "warming_drawer"              // Tiroir chauffant
  | "vacuum_drawer"               // Tiroir sous vide
  | "coffee_machine"              // Machines à café
  | "coffee_machine_built_in"     // Machine café encastrée
  | "espresso_machine"            // Machine expresso
  | "ice_maker"                   // Machine à glaçons
  | "water_dispenser"             // Fontaine à eau
  | "trash_compactor"             // Compacteur déchets
  | "garbage_disposal"            // Broyeur évier
  
  // ═══════════════════════════════════════════════════════════════════════════
  // BUANDERIE & ÉLECTROMÉNAGER
  // ═══════════════════════════════════════════════════════════════════════════
  | "washing_machine"             // Lave-linge
  | "washing_machine_front"       // Lave-linge frontal
  | "washing_machine_top"         // Lave-linge top
  | "washing_machine_built_in"    // Lave-linge encastrable
  | "dryer"                       // Sèche-linge
  | "dryer_vented"                // Sèche-linge évacuation
  | "dryer_condenser"             // Sèche-linge condensation
  | "dryer_heat_pump"             // Sèche-linge pompe à chaleur
  | "washer_dryer"                // Lave-linge séchant
  | "stacked_washer_dryer"        // Colonne lave-sèche
  | "laundry_sink"                // Bac à laver
  | "laundry_cabinet"             // Meuble buanderie
  | "laundry_hamper"              // Panier à linge
  | "drying_rack"                 // Étendoir
  | "ironing_board"               // Planche à repasser
  | "ironing_board_built_in"      // Table à repasser intégrée
  | "iron"                        // Fer à repasser
  | "steam_generator"             // Centrale vapeur
  | "garment_steamer"             // Défroisseur
  | "vacuum"                      // Aspirateurs
  | "vacuum_canister"             // Aspirateur traîneau
  | "vacuum_upright"              // Aspirateur balai
  | "vacuum_stick"                // Aspirateur sans fil
  | "vacuum_handheld"             // Aspirateur main
  | "vacuum_central"              // Aspiration centralisée
  | "robot_vacuum"                // Robots aspirateurs
  | "robot_mop"                   // Robot laveur
  | "carpet_cleaner"              // Shampouineuse
  | "steam_cleaner"               // Nettoyeur vapeur
  | "air_purifier"                // Purificateur d'air
  | "dehumidifier"                // Déshumidificateur
  | "humidifier"                  // Humidificateur
  | "fan_portable"                // Ventilateur
  | "heater_portable"             // Chauffage d'appoint
  
  // ═══════════════════════════════════════════════════════════════════════════
  // SALLE DE BAIN - MEUBLES & ACCESSOIRES
  // ═══════════════════════════════════════════════════════════════════════════
  | "bathroom_vanity"             // Meuble vasque
  | "bathroom_vanity_single"      // Meuble simple vasque
  | "bathroom_vanity_double"      // Meuble double vasque
  | "bathroom_vanity_floating"    // Meuble suspendu
  | "bathroom_vanity_freestanding"// Meuble sur pieds
  | "bathroom_cabinet"            // Armoire salle de bain
  | "bathroom_cabinet_wall"       // Armoire murale
  | "bathroom_cabinet_tall"       // Colonne salle de bain
  | "bathroom_cabinet_corner"     // Meuble angle
  | "bathroom_mirror"             // Miroirs de salle de bain
  | "bathroom_mirror_led"         // Miroir LED
  | "bathroom_mirror_cabinet"     // Armoire de toilette
  | "bathroom_mirror_magnifying"  // Miroir grossissant
  | "bathroom_mirror_heated"      // Miroir antibuée
  | "medicine_cabinet"            // Armoire pharmacie
  | "towel_bar"                   // Porte-serviettes barre
  | "towel_ring"                  // Anneaux porte-serviettes
  | "towel_hook"                  // Patère serviette
  | "towel_rack"                  // Portant serviettes
  | "towel_shelf"                 // Étagère porte-serviettes
  | "toilet_paper_holder"         // Porte-rouleaux
  | "toilet_paper_stand"          // Support rouleau sur pied
  | "toilet_brush"                // Brosse WC
  | "toilet_brush_holder"         // Support brosse WC
  | "soap_dispenser"              // Distributeur savon
  | "soap_dispenser_wall"         // Distributeur mural
  | "soap_dish"                   // Porte-savon
  | "toothbrush_holder"           // Porte-brosses à dents
  | "tumbler_holder"              // Porte-gobelet
  | "bathroom_shelf"              // Étagères salle de bain
  | "bathroom_shelf_glass"        // Tablette verre
  | "shower_shelf"                // Étagère de douche
  | "corner_shelf"                // Étagère d'angle
  | "bath_mat"                    // Tapis de bain
  | "bath_mat_stone"              // Tapis pierre
  | "shower_curtain"              // Rideaux de douche
  | "shower_curtain_rod"          // Barre rideau douche
  | "bathroom_scale"              // Pèse-personne
  | "bathroom_stool"              // Tabouret salle de bain
  | "laundry_basket"              // Panier à linge
  | "makeup_mirror"               // Miroir maquillage
  | "hair_dryer_holder"           // Support sèche-cheveux
  | "grab_bar"                    // Barre d'appui
  
  // ═══════════════════════════════════════════════════════════════════════════
  // MULTIMÉDIA & HIGH-TECH
  // ═══════════════════════════════════════════════════════════════════════════
  | "television"                  // Télévisions
  | "tv_led"                      // TV LED
  | "tv_oled"                     // TV OLED
  | "tv_qled"                     // TV QLED
  | "tv_curved"                   // TV incurvée
  | "tv_frame"                    // TV tableau
  | "projector"                   // Vidéoprojecteurs
  | "projector_home"              // Projecteur home cinéma
  | "projector_ultra_short"       // Projecteur ultra courte focale
  | "projector_portable"          // Projecteur portable
  | "projector_screen"            // Écrans de projection
  | "screen_fixed"                // Écran fixe
  | "screen_motorized"            // Écran motorisé
  | "screen_pull_down"            // Écran déroulant
  | "speaker"                     // Enceintes
  | "speaker_bookshelf"           // Enceinte bibliothèque
  | "speaker_floor"               // Enceinte colonne
  | "speaker_center"              // Enceinte centrale
  | "speaker_subwoofer"           // Caisson de basse
  | "speaker_surround"            // Enceinte surround
  | "speaker_ceiling"             // Enceinte encastrée plafond
  | "speaker_wall"                // Enceinte encastrée mur
  | "speaker_outdoor"             // Enceinte extérieure
  | "speaker_bluetooth"           // Enceinte Bluetooth
  | "smart_speaker"               // Enceinte connectée
  | "soundbar"                    // Barres de son
  | "soundbar_dolby"              // Barre son Dolby Atmos
  | "home_cinema"                 // Système home cinéma
  | "av_receiver"                 // Ampli home cinéma
  | "record_player"               // Platine vinyle
  | "turntable"                   // Tourne-disque
  | "gaming_setup"                // Setup gaming
  | "gaming_desk"                 // Bureau gaming
  | "gaming_chair"                // Fauteuil gaming
  | "gaming_monitor"              // Écran gaming
  | "console_gaming"              // Console de jeux
  | "vr_headset"                  // Casque VR
  | "streaming_device"            // Appareil streaming
  | "media_player"                // Lecteur multimédia
  | "blu_ray_player"              // Lecteur Blu-ray
  
  // ═══════════════════════════════════════════════════════════════════════════
  // RANGEMENT & ORGANISATION
  // ═══════════════════════════════════════════════════════════════════════════
  | "coat_rack"                   // Porte-manteaux
  | "coat_rack_wall"              // Patère murale
  | "coat_rack_standing"          // Portemanteau sur pied
  | "coat_rack_tree"              // Arbre à manteau
  | "coat_closet"                 // Penderie d'entrée
  | "shoe_rack"                   // Meubles à chaussures
  | "shoe_cabinet"                // Meuble à chaussures fermé
  | "shoe_bench"                  // Banc range-chaussures
  | "shoe_shelf"                  // Étagère à chaussures
  | "umbrella_stand"              // Porte-parapluies
  | "key_holder"                  // Porte-clés mural
  | "key_cabinet"                 // Armoire à clés
  | "mail_organizer"              // Organisateur courrier
  | "wall_hook"                   // Patères
  | "wall_hook_row"               // Rangée de patères
  | "storage_box"                 // Boîtes de rangement
  | "storage_bin"                 // Bac de rangement
  | "storage_cube"                // Cube de rangement
  | "storage_ottoman"             // Pouf coffre
  | "basket"                      // Paniers
  | "wicker_basket"               // Panier osier
  | "wire_basket"                 // Panier fil métallique
  | "fabric_basket"               // Panier tissu
  | "magazine_rack"               // Porte-revues
  | "record_storage"              // Rangement vinyles
  | "media_storage"               // Rangement médias
  | "closet_system"               // Système dressing
  | "closet_rod"                  // Penderie
  | "closet_shelf"                // Étagère placard
  | "drawer_divider"              // Séparateur tiroir
  | "jewelry_organizer"           // Organisateur bijoux
  | "tie_rack"                    // Porte-cravates
  | "belt_hanger"                 // Porte-ceintures
  | "scarf_hanger"                // Porte-foulards
  
  // ═══════════════════════════════════════════════════════════════════════════
  // ACCESSIBILITÉ PMR & ASCENSEURS
  // ═══════════════════════════════════════════════════════════════════════════
  | "wheelchair_ramp"             // Rampe PMR
  | "ramp_portable"               // Rampe mobile
  | "ramp_permanent"              // Rampe fixe
  | "platform_lift"               // Élévateur
  | "stair_lift"                  // Monte-escalier
  | "home_elevator"               // Ascenseur privatif
  | "elevator_cabin"              // Cabine ascenseur
  | "elevator_door"               // Porte ascenseur
  | "elevator_panel"              // Panneau de commande
  | "elevator_button"             // Bouton d'appel
  | "grab_bar_pmr"                // Barre d'appui PMR
  | "fold_down_seat"              // Siège rabattable
  | "accessible_shower"           // Douche accessible
  | "accessible_toilet"           // WC PMR
  | "accessible_sink"             // Lavabo PMR
  | "tactile_paving"              // Bande podotactile
  | "handrail_continuous"         // Main courante continue
  | "door_opener_auto"            // Ouvre-porte automatique
  | "lowered_counter"             // Comptoir abaissé
  
  // ═══════════════════════════════════════════════════════════════════════════
  // COMMERCIAL & PROFESSIONNEL
  // ═══════════════════════════════════════════════════════════════════════════
  | "shop_window"                 // Vitrine magasin
  | "display_window"              // Vitrine d'exposition
  | "mannequin"                   // Mannequin
  | "display_shelf"               // Rayonnage
  | "gondola"                     // Gondole magasin
  | "checkout_counter"            // Caisse
  | "cash_register"               // Caisse enregistreuse
  | "pos_terminal"                // Terminal de paiement
  | "shop_sign"                   // Enseigne
  | "sign_illuminated"            // Enseigne lumineuse
  | "sign_neon"                   // Néon
  | "sign_led"                    // Panneau LED
  | "awning_commercial"           // Store commercial
  | "menu_board"                  // Tableau menu
  | "price_display"               // Affichage prix
  | "product_display"             // Présentoir produits
  | "brochure_holder"             // Porte-brochures
  | "poster_frame"                // Cadre affiche
  | "banner_stand"                // Kakémono
  | "reception_desk"              // Comptoir accueil
  | "waiting_room_chair"          // Siège salle d'attente
  | "waiting_room_sofa"           // Banquette attente
  | "partition_office"            // Cloison bureau
  | "cubicle"                     // Box bureau
  | "conference_table"            // Table de conférence
  | "conference_chair"            // Siège conférence
  | "presentation_screen"         // Écran présentation
  | "interactive_display"         // Écran interactif
  | "video_wall"                  // Mur d'écrans
  | "display_case"                // Vitrine exposition
  | "museum_case"                 // Vitrine musée
  | "trophy_case"                 // Vitrine trophées
  | "cold_room"                   // Chambre froide
  | "walk_in_freezer"             // Chambre négative
  | "commercial_refrigerator"     // Réfrigérateur commercial
  | "display_fridge"              // Vitrine réfrigérée
  | "commercial_oven"             // Four professionnel
  | "commercial_range"            // Fourneau pro
  | "stainless_worktop"           // Plan inox pro
  | "commercial_hood"             // Hotte pro
  | "industrial_sink"             // Évier pro
  | "beer_tap"                    // Tireuse bière
  | "coffee_bar"                  // Comptoir café
  
  // ═══════════════════════════════════════════════════════════════════════════
  // ACOUSTIQUE
  // ═══════════════════════════════════════════════════════════════════════════
  | "acoustic_panel"              // Panneau acoustique
  | "acoustic_panel_wall"         // Panneau mural
  | "acoustic_panel_ceiling"      // Panneau plafond
  | "acoustic_cloud"              // Nuage acoustique
  | "acoustic_baffle"             // Baffles acoustiques
  | "acoustic_foam"               // Mousse acoustique
  | "acoustic_wedge"              // Mousse pyramidale
  | "bass_trap"                   // Bass trap
  | "diffuser_acoustic"           // Diffuseur acoustique
  | "sound_absorber"              // Absorbeur
  | "acoustic_curtain"            // Rideau acoustique
  | "soundproof_door"             // Porte acoustique
  | "soundproof_window"           // Fenêtre acoustique
  | "isolation_booth"             // Cabine isolation
  | "recording_studio"            // Studio d'enregistrement
  | "home_studio"                 // Home studio
  
  // ═══════════════════════════════════════════════════════════════════════════
  // VÉHICULES & STATIONNEMENT (CONTEXTE)
  // ═══════════════════════════════════════════════════════════════════════════
  | "car"                         // Voiture (contexte)
  | "motorcycle"                  // Moto
  | "bicycle"                     // Vélos
  | "electric_bike"               // Vélo électrique
  | "scooter"                     // Trottinette
  | "bike_rack"                   // Porte-vélos
  | "bike_stand"                  // Range-vélo
  | "bike_shelter"                // Abri vélos
  | "garage"                      // Garages
  | "garage_floor"                // Sol garage
  | "garage_cabinet"              // Armoire garage
  | "garage_workbench"            // Établi garage
  | "tool_storage"                // Rangement outils
  | "wall_panel_tools"            // Panneau porte-outils
  
  // ═══════════════════════════════════════════════════════════════════════════
  // DIVERS & PERSONNALISÉ
  // ═══════════════════════════════════════════════════════════════════════════
  | "pet_bed"                     // Panier animal
  | "pet_house"                   // Niche
  | "cat_tree"                    // Arbre à chat
  | "bird_cage"                   // Cage oiseau
  | "fish_tank"                   // Aquarium
  | "terrarium_pet"               // Terrarium reptile
  | "exercise_equipment"          // Équipement fitness
  | "treadmill"                   // Tapis de course
  | "exercise_bike"               // Vélo d'appartement
  | "home_gym"                    // Salle de sport maison
  | "yoga_mat"                    // Tapis yoga
  | "weight_rack"                 // Rack haltères
  | "musical_instrument"          // Instrument musique
  | "piano"                       // Piano
  | "piano_grand"                 // Piano à queue
  | "piano_upright"               // Piano droit
  | "piano_digital"               // Piano numérique
  | "guitar_stand"                // Support guitare
  | "music_stand"                 // Pupitre
  | "custom";                     // Élément personnalisé (si aucune catégorie ne convient)


/**
 * Types de modification possibles sur les éléments
 */
export type ModificationType =
  // ═══════════════════════════════════════════════════════════════════════════
  // SURFACES & REVÊTEMENTS
  // ═══════════════════════════════════════════════════════════════════════════
  | "floor"                   // Modification de sol
  | "wall"                    // Modification de mur
  | "ceiling"                 // Modification de plafond
  | "facade"                  // Modification de façade
  | "roof"                    // Modification de toiture
  | "terrace"                 // Modification de terrasse
  
  // ═══════════════════════════════════════════════════════════════════════════
  // STRUCTURE
  // ═══════════════════════════════════════════════════════════════════════════
  | "structure"               // Modification structurelle
  | "staircase"               // Modification d'escalier
  | "partition"               // Modification de cloison
  | "framework"               // Modification de charpente
  
  // ═══════════════════════════════════════════════════════════════════════════
  // MENUISERIE & FERMETURES
  // ═══════════════════════════════════════════════════════════════════════════
  | "window"                  // Modification de fenêtre
  | "door"                    // Modification de porte
  | "shutter"                 // Modification de volet
  | "gate"                    // Modification de portail
  | "fence"                   // Modification de clôture
  | "railing"                 // Modification de garde-corps
  | "pergola"                 // Modification de pergola/tonnelle
  
  // ═══════════════════════════════════════════════════════════════════════════
  // MOBILIER
  // ═══════════════════════════════════════════════════════════════════════════
  | "furniture"               // Mobilier général
  | "seating"                 // Assises
  | "table"                   // Tables
  | "storage"                 // Rangements
  | "bed"                     // Literie
  | "outdoor_furniture"       // Mobilier extérieur
  
  // ═══════════════════════════════════════════════════════════════════════════
  // ÉCLAIRAGE
  // ═══════════════════════════════════════════════════════════════════════════
  | "lighting"                // Éclairage général
  | "ceiling_light"           // Éclairage plafond
  | "wall_light"              // Éclairage mural
  | "floor_light"             // Éclairage au sol
  | "outdoor_light"           // Éclairage extérieur
  
  // ═══════════════════════════════════════════════════════════════════════════
  // TECHNIQUE
  // ═══════════════════════════════════════════════════════════════════════════
  | "plumbing"                // Plomberie
  | "sanitary"                // Sanitaires
  | "electrical"              // Électricité
  | "heating"                 // Chauffage
  | "cooling"                 // Climatisation
  | "ventilation"             // Ventilation
  | "energy"                  // Équipements énergétiques (solaire, PAC...)
  | "security"                // Sécurité (alarme, caméra...)
  | "domotics"                // Domotique
  
  // ═══════════════════════════════════════════════════════════════════════════
  // TOITURE & COUVERTURE
  // ═══════════════════════════════════════════════════════════════════════════
  | "roofing"                 // Couverture
  | "gutter"                  // Gouttières
  | "chimney"                 // Cheminées
  
  // ═══════════════════════════════════════════════════════════════════════════
  // EXTÉRIEUR & PAYSAGE
  // ═══════════════════════════════════════════════════════════════════════════
  | "outdoor"                 // Extérieur général
  | "garden"                  // Jardin
  | "landscape"               // Paysage
  | "pool"                    // Piscine
  | "vegetation"              // Végétation
  | "pathway"                 // Allées
  
  // ═══════════════════════════════════════════════════════════════════════════
  // DÉCORATION
  // ═══════════════════════════════════════════════════════════════════════════
  | "decoration"              // Décoration générale
  | "artwork"                 // Art
  | "textile"                 // Textiles
  | "plant"                   // Plantes
  
  // ═══════════════════════════════════════════════════════════════════════════
  // PIÈCES SPÉCIFIQUES
  // ═══════════════════════════════════════════════════════════════════════════
  | "kitchen"                 // Cuisine
  | "bathroom"                // Salle de bain
  | "appliance"               // Électroménager
  
  // ═══════════════════════════════════════════════════════════════════════════
  // ACTIONS
  // ═══════════════════════════════════════════════════════════════════════════
  | "add_element"             // Ajout d'élément
  | "remove_element"          // Suppression d'élément
  | "relocate_element"        // Déplacement d'élément
  
  // ═══════════════════════════════════════════════════════════════════════════
  // PERSONNALISÉ
  // ═══════════════════════════════════════════════════════════════════════════
  | "custom";                 // Type personnalisé


/**
 * Actions de modification possibles
 */
export type ModificationAction =
  | "replace_material"        // Changer le matériau/texture d'une surface
  | "replace_object"          // Remplacer un objet entier par un autre
  | "add_element"             // Ajouter un nouvel élément
  | "remove_element"          // Retirer un élément
  | "modify_style"            // Modifier le style (couleur, finition)
  | "modify_color"            // Changer uniquement la couleur
  | "modify_finish"           // Changer uniquement la finition
  | "resize_element"          // Redimensionner un élément
  | "relocate_element"        // Déplacer un élément
  | "upgrade_equipment"       // Mettre à niveau un équipement
  | "repair_element"          // Réparer/rénover un élément
  | "modernize_element";      // Moderniser un élément


/**
 * Type de référence fournie par l'utilisateur
 * Classification étendue pour tous types d'images de référence
 */
export type ReferenceType =
  // ═══════════════════════════════════════════════════════════════════════════
  // TEXTURES & MATÉRIAUX
  // ═══════════════════════════════════════════════════════════════════════════
  | "texture"                 // Texture pure (répétitive)
  | "material_sample"         // Échantillon de matériau
  | "paint_color"             // Couleur de peinture
  | "wallpaper"               // Papier peint
  | "tile_pattern"            // Motif de carrelage
  | "wood_sample"             // Échantillon bois
  | "stone_sample"            // Échantillon pierre
  | "fabric_sample"           // Échantillon tissu
  
  // ═══════════════════════════════════════════════════════════════════════════
  // PRODUITS & OBJETS
  // ═══════════════════════════════════════════════════════════════════════════
  | "product_photo"           // Photo de produit (catalogue)
  | "product_packshot"        // Packshot produit (fond blanc)
  | "3d_render"               // Rendu 3D
  | "3d_model"                // Modèle 3D
  | "cad_drawing"             // Dessin CAO
  | "furniture_photo"         // Photo de meuble
  | "lighting_fixture"        // Photo de luminaire
  | "decoration_item"         // Objet décoratif
  
  // ═══════════════════════════════════════════════════════════════════════════
  // VÉGÉTATION
  // ═══════════════════════════════════════════════════════════════════════════
  | "plant_photo"             // Photo de plante
  | "tree_photo"              // Photo d'arbre
  | "flower_photo"            // Photo de fleurs
  | "garden_element"          // Élément de jardin
  
  // ═══════════════════════════════════════════════════════════════════════════
  // ÉQUIPEMENTS TECHNIQUES
  // ═══════════════════════════════════════════════════════════════════════════
  | "technical_equipment"     // Équipement technique
  | "solar_equipment"         // Équipement solaire
  | "hvac_equipment"          // Équipement CVC
  | "plumbing_fixture"        // Équipement plomberie
  | "electrical_fixture"      // Équipement électrique
  | "appliance_photo"         // Photo électroménager
  
  // ═══════════════════════════════════════════════════════════════════════════
  // ÉLÉMENTS ARCHITECTURAUX
  // ═══════════════════════════════════════════════════════════════════════════
  | "architectural_element"   // Élément architectural
  | "door_photo"              // Photo de porte
  | "window_photo"            // Photo de fenêtre
  | "railing_photo"           // Photo de garde-corps
  | "facade_element"          // Élément de façade
  
  // ═══════════════════════════════════════════════════════════════════════════
  // AMBIANCE & STYLE
  // ═══════════════════════════════════════════════════════════════════════════
  | "ambiance_photo"          // Photo d'ambiance
  | "style_reference"         // Référence de style
  | "color_palette"           // Palette de couleurs
  | "mood_board"              // Planche tendance
  
  // ═══════════════════════════════════════════════════════════════════════════
  // AUTRE
  // ═══════════════════════════════════════════════════════════════════════════
  | "screenshot"              // Capture d'écran
  | "sketch"                  // Croquis
  | "custom";                 // Type personnalisé


/**
 * Type d'action déterminée pour la référence
 */
export type ReferenceAction =
  | "apply_texture"           // Appliquer comme texture sur surface
  | "replace_object"          // Remplacer un objet existant
  | "add_element"             // Ajouter comme nouvel élément
  | "use_as_style"            // Utiliser comme référence de style
  | "extract_color";          // Extraire et appliquer la couleur


/**
 * Métiers couverts par le système
 * Pour documentation et validation
 */
export type TradeCategory =
  | "general_construction"    // BTP général
  | "architecture"            // Architecture
  | "interior_design"         // Design d'intérieur
  | "decoration"              // Décoration
  | "renovation"              // Rénovation
  | "real_estate"             // Immobilier
  | "carpentry"               // Menuiserie
  | "facade_work"             // Façadier
  | "wood_construction"       // Construction bois
  | "closures"                // Fermetures
  | "plumbing"                // Plomberie
  | "electrical"              // Électricité
  | "heating_cooling"         // Chauffage/Climatisation
  | "roofing"                 // Couverture/Toiture
  | "landscaping"             // Paysagisme
  | "pool_spa"                // Piscine/Spa
  | "energy"                  // Énergie/EnR
  | "security"                // Sécurité
  | "home_automation"         // Domotique
  | "kitchen_bathroom"        // Cuisine/Salle de bain
  | "flooring"                // Revêtement de sol
  | "painting"                // Peinture
  | "masonry"                 // Maçonnerie
  | "metalwork"               // Métallerie
  | "glass_work";             // Vitrerie/Miroiterie
