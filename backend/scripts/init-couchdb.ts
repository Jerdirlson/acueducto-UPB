// Script de inicialización de CouchDB
// Crea la base de datos, design documents y usuario admin por defecto
import PouchDB from 'pouchdb';
import PouchDBFind from 'pouchdb-find';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Registrar plugin find
PouchDB.plugin(PouchDBFind);

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Cargar variables de entorno
dotenv.config({ path: path.join(__dirname, '../.env') });

const COUCHDB_URL = process.env.COUCHDB_URL || 'http://localhost:5984';
const COUCHDB_USER = process.env.COUCHDB_USER || 'admin';
const COUCHDB_PASSWORD = process.env.COUCHDB_PASSWORD || '';
const COUCHDB_DB_NAME = process.env.COUCHDB_DB_NAME || 'acueducto';

// Construir URL con autenticación
const dbUrl = COUCHDB_URL.includes('@')
  ? `${COUCHDB_URL}/${COUCHDB_DB_NAME}`
  : `${COUCHDB_URL.replace('://', `://${COUCHDB_USER}:${COUCHDB_PASSWORD}@`)}/${COUCHDB_DB_NAME}`;

// Credenciales del usuario admin por defecto
const DEFAULT_ADMIN_USERNAME = process.env.DEFAULT_ADMIN_USERNAME || 'admin';
const DEFAULT_ADMIN_PASSWORD = process.env.DEFAULT_ADMIN_PASSWORD || 'admin123';

/**
 * Crear usuario admin por defecto si no existe
 */
async function createDefaultAdmin(db: PouchDB.Database) {
  const adminId = `user:${DEFAULT_ADMIN_USERNAME}`;

  try {
    // Verificar si el usuario admin ya existe
    await db.get(adminId);
    console.log(`   ℹ️ Usuario admin '${DEFAULT_ADMIN_USERNAME}' ya existe`);
  } catch (error: any) {
    if (error.status === 404) {
      // Crear usuario admin
      const passwordHash = await bcrypt.hash(DEFAULT_ADMIN_PASSWORD, 10);
      const now = new Date().toISOString();

      const adminUser = {
        _id: adminId,
        type: 'user',
        username: DEFAULT_ADMIN_USERNAME,
        passwordHash: passwordHash,
        role: 'admin',
        fullName: 'Administrador',
        email: '',
        active: true,
        createdAt: now,
        updatedAt: now
      };

      await db.put(adminUser);
      console.log(`   ✅ Usuario admin creado: ${DEFAULT_ADMIN_USERNAME}`);
      console.log(`   ⚠️ Contraseña por defecto: ${DEFAULT_ADMIN_PASSWORD}`);
      console.log(`   ⚠️ ¡IMPORTANTE! Cambia la contraseña después del primer login`);
    } else {
      throw error;
    }
  }
}

async function initCouchDB() {
  console.log('🚀 Inicializando CouchDB...');
  console.log(`📍 URL: ${COUCHDB_URL}`);
  console.log(`📦 Base de datos: ${COUCHDB_DB_NAME}`);

  try {
    // Crear conexión a CouchDB
    const db = new PouchDB(dbUrl);

    // Verificar conexión
    console.log('🔍 Verificando conexión...');
    const info = await db.info();
    console.log('✅ Conexión exitosa');
    console.log(`   Base de datos: ${info.db_name}`);
    console.log(`   Documentos: ${info.doc_count}`);

    // Crear design documents
    console.log('📝 Creando design documents...');

    // Design document para filtros por tipo
    const filtersDesign = {
      _id: '_design/filters',
      views: {
        by_type: {
          map: `function(doc) {
            if (doc.type) {
              emit(doc.type, doc);
            }
          }`
        }
      }
    };

    // Design document para properties
    const propertiesDesign = {
      _id: '_design/properties',
      views: {
        by_status: {
          map: `function(doc) {
            if (doc.type === 'property') {
              emit(doc.status, doc);
            }
          }`
        }
      }
    };

    // Design document para payments
    const paymentsDesign = {
      _id: '_design/payments',
      views: {
        by_property: {
          map: `function(doc) {
            if (doc.type === 'payment') {
              emit(doc.propertyId, doc);
            }
          }`
        },
        by_semester: {
          map: `function(doc) {
            if (doc.type === 'payment') {
              emit(doc.semester, doc);
            }
          }`
        }
      }
    };

    // Design document para incidents
    const incidentsDesign = {
      _id: '_design/incidents',
      views: {
        by_status: {
          map: `function(doc) {
            if (doc.type === 'incident') {
              emit(doc.status, doc);
            }
          }`
        },
        by_date: {
          map: `function(doc) {
            if (doc.type === 'incident') {
              emit(doc.dateReported, doc);
            }
          }`
        }
      }
    };

    // Intentar obtener design documents existentes y actualizarlos
    const designs = [filtersDesign, propertiesDesign, paymentsDesign, incidentsDesign];
    
    for (const design of designs) {
      try {
        const existing = await db.get(design._id);
        design._rev = existing._rev;
        await db.put(design);
        console.log(`   ✅ Actualizado: ${design._id}`);
      } catch (error: any) {
        if (error.status === 404) {
          await db.put(design);
          console.log(`   ✅ Creado: ${design._id}`);
        } else {
          throw error;
        }
      }
    }

    // Crear usuario admin por defecto
    console.log('👤 Verificando usuario admin...');
    await createDefaultAdmin(db);

    // Crear índice para buscar usuarios por username
    console.log('📇 Creando índices...');
    try {
      await db.createIndex({
        index: { fields: ['type', 'username'] }
      });
      console.log('   ✅ Índice type+username creado');
    } catch (indexError) {
      console.log('   ⚠️ Índice ya existe o no se pudo crear');
    }

    console.log('✅ Inicialización completada exitosamente');
    console.log(`📊 Base de datos lista: ${COUCHDB_DB_NAME}`);

  } catch (error: any) {
    if (error.status === 404) {
      // Base de datos no existe, intentar crearla
      console.log('📦 Base de datos no existe, creando...');
      try {
        const baseUrl = COUCHDB_URL.includes('@')
          ? COUCHDB_URL
          : COUCHDB_URL.replace('://', `://${COUCHDB_USER}:${COUCHDB_PASSWORD}@`);
        
        const response = await fetch(`${baseUrl}/${COUCHDB_DB_NAME}`, {
          method: 'PUT'
        });

        if (response.ok) {
          console.log('✅ Base de datos creada');
          // Reintentar inicialización
          return initCouchDB();
        } else {
          const errorData = await response.json();
          throw new Error(`Error creando base de datos: ${JSON.stringify(errorData)}`);
        }
      } catch (createError) {
        console.error('❌ Error creando base de datos:', createError);
        throw createError;
      }
    } else {
      console.error('❌ Error durante inicialización:', error);
      if (error.message) {
        console.error('   Mensaje:', error.message);
      }
      process.exit(1);
    }
  }
}

// Ejecutar inicialización
initCouchDB()
  .then(() => {
    console.log('🎉 Proceso completado');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Error fatal:', error);
    process.exit(1);
  });

