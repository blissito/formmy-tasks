#!/usr/bin/env node
/**
 * Seed Admin Users Script (Reusable Version)
 *
 * This script creates admin users with full permissions using direct SQL.
 * Run this AFTER the first deployment via SSH.
 *
 * Usage:
 * flyctl ssh console --app your-app-name -C "sh -c 'ADMIN_USERS=\"email1@example.com:Name One,email2@example.com:Name Two\" ADMIN_PASSWORD=\"YourPass@123\" DATABASE_PATH=/data/database.sqlite/database.sqlite node /usr/src/seed-admin-users-simple.js'"
 *
 * Environment Variables:
 * - ADMIN_USERS: Comma-separated list of email:name pairs (required)
 * - ADMIN_PASSWORD: Password for all admin users (required, must meet complexity requirements)
 * - DATABASE_PATH: Path to SQLite database (default: /data/database.sqlite/database.sqlite)
 *
 * Password Requirements:
 * - Minimum 8 characters
 * - At least one lowercase letter
 * - At least one uppercase letter
 * - At least one number
 * - At least one special character
 */

const sqlite3 = require('sqlite3').verbose()
const bcrypt = require('bcryptjs')
const { v4: uuidv4 } = require('uuid')

// Database configuration
const DATABASE_PATH = process.env.DATABASE_PATH || '/data/database.sqlite/database.sqlite'

// Parse users from environment variable
function parseAdminUsers() {
    const usersEnv = process.env.ADMIN_USERS

    if (!usersEnv) {
        console.error('❌ Error: ADMIN_USERS environment variable is required')
        console.error('Format: "email1@example.com:Name One,email2@example.com:Name Two"')
        process.exit(1)
    }

    try {
        return usersEnv.split(',').map(userStr => {
            const [email, name] = userStr.split(':')
            if (!email || !name) {
                throw new Error(`Invalid format: ${userStr}`)
            }
            return { email: email.trim(), name: name.trim() }
        })
    } catch (err) {
        console.error('❌ Error parsing ADMIN_USERS:', err.message)
        console.error('Format: "email1@example.com:Name One,email2@example.com:Name Two"')
        process.exit(1)
    }
}

// Validate password requirements
function validatePassword(password) {
    if (!password) {
        return { valid: false, errors: ['Password is required'] }
    }

    const errors = []
    if (!/(?=.*[a-z])/.test(password)) errors.push('at least one lowercase letter')
    if (!/(?=.*[A-Z])/.test(password)) errors.push('at least one uppercase letter')
    if (!/(?=.*\d)/.test(password)) errors.push('at least one number')
    if (!/(?=.*[^a-zA-Z0-9])/.test(password)) errors.push('at least one special character')
    if (password.length < 8) errors.push('minimum length of 8 characters')

    return { valid: errors.length === 0, errors }
}

// Get password from environment
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD

if (!ADMIN_PASSWORD) {
    console.error('❌ Error: ADMIN_PASSWORD environment variable is required')
    process.exit(1)
}

// Validate password
const passwordValidation = validatePassword(ADMIN_PASSWORD)
if (!passwordValidation.valid) {
    console.error('❌ Invalid password. Must contain:')
    passwordValidation.errors.forEach(err => console.error(`   - ${err}`))
    process.exit(1)
}

// Users to create
const ADMIN_USERS = parseAdminUsers()

// Hash password
function hashPassword(password) {
    const salt = bcrypt.genSaltSync(10)
    return bcrypt.hashSync(password, salt)
}

// Get current timestamp in SQLite format
function now() {
    return new Date().toISOString()
}

async function seedAdminUsers() {
    console.log('🚀 Starting admin users seed...')
    console.log(`📁 Database path: ${DATABASE_PATH}`)

    return new Promise((resolve, reject) => {
        const db = new sqlite3.Database(DATABASE_PATH, (err) => {
            if (err) {
                console.error('❌ Error opening database:', err)
                reject(err)
                return
            }
            console.log('✅ Database connection established')
        })

        db.serialize(() => {
            // Check if users already exist
            db.all(
                'SELECT email FROM user WHERE email IN (?, ?, ?)',
                ADMIN_USERS.map(u => u.email),
                (err, rows) => {
                    if (err) {
                        console.error('❌ Error checking existing users:', err)
                        db.close()
                        reject(err)
                        return
                    }

                    if (rows && rows.length > 0) {
                        console.log('⚠️  Some users already exist:')
                        rows.forEach(u => console.log(`   - ${u.email}`))
                        console.log('Skipping user creation.')
                        db.close()
                        resolve()
                        return
                    }

                    // Begin transaction
                    db.run('BEGIN TRANSACTION')

                    const hashedPassword = hashPassword(ADMIN_PASSWORD)
                    console.log('🔐 Password hashed successfully')

                    // Create IDs
                    const orgId = uuidv4()
                    const firstUserId = uuidv4()
                    const roleId = uuidv4()
                    const workspaceId = uuidv4()
                    const timestamp = now()

                    const ownerPermissions = JSON.stringify({
                        canRead: true,
                        canWrite: true,
                        canDelete: true,
                        canManageUsers: true,
                        canManageSettings: true,
                        isOwner: true
                    })

                    // Create organization
                    console.log('📦 Creating Default Organization...')
                    db.run(
                        `INSERT INTO organization (id, name, createdBy, updatedBy, createdDate, updatedDate)
                         VALUES (?, ?, ?, ?, ?, ?)`,
                        [orgId, 'Default Organization', firstUserId, firstUserId, timestamp, timestamp],
                        (err) => {
                            if (err) {
                                console.error('Error creating organization:', err)
                                db.run('ROLLBACK')
                                db.close()
                                reject(err)
                                return
                            }

                            // Create owner role
                            console.log('👑 Creating Owner Role...')
                            db.run(
                                `INSERT INTO role (id, organizationId, name, description, permissions, createdBy, updatedBy, createdDate, updatedDate)
                                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                                [roleId, orgId, 'owner', 'Organization Owner', ownerPermissions, firstUserId, firstUserId, timestamp, timestamp],
                                (err) => {
                                    if (err) {
                                        console.error('Error creating role:', err)
                                        db.run('ROLLBACK')
                                        db.close()
                                        reject(err)
                                        return
                                    }

                                    // Create workspace
                                    console.log('🏢 Creating Default Workspace...')
                                    db.run(
                                        `INSERT INTO workspace (id, organizationId, name, description, createdBy, updatedBy, createdDate, updatedDate)
                                         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                                        [workspaceId, orgId, 'Default Workspace', 'Main workspace for m-flows', firstUserId, firstUserId, timestamp, timestamp],
                                        (err) => {
                                            if (err) {
                                                console.error('Error creating workspace:', err)
                                                db.run('ROLLBACK')
                                                db.close()
                                                reject(err)
                                                return
                                            }

                                            // Create users
                                            let usersCreated = 0
                                            const totalUsers = ADMIN_USERS.length

                                            ADMIN_USERS.forEach((user, index) => {
                                                const userId = index === 0 ? firstUserId : uuidv4()

                                                console.log(`👤 Creating user: ${user.email}`)

                                                // Insert user
                                                db.run(
                                                    `INSERT INTO user (id, name, email, credential, status, createdBy, updatedBy, createdDate, updatedDate)
                                                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                                                    [userId, user.name, user.email, hashedPassword, 'active', userId, userId, timestamp, timestamp],
                                                    (err) => {
                                                        if (err) {
                                                            console.error(`Error creating user ${user.email}:`, err)
                                                            db.run('ROLLBACK')
                                                            db.close()
                                                            reject(err)
                                                            return
                                                        }

                                                        // Add user to organization
                                                        db.run(
                                                            `INSERT INTO organization_user (organizationId, userId, roleId, status, createdBy, updatedBy, createdDate, updatedDate)
                                                             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                                                            [orgId, userId, roleId, 'active', userId, userId, timestamp, timestamp],
                                                            (err) => {
                                                                if (err) {
                                                                    console.error(`Error adding user to organization:`, err)
                                                                    db.run('ROLLBACK')
                                                                    db.close()
                                                                    reject(err)
                                                                    return
                                                                }

                                                                // Add user to workspace
                                                                db.run(
                                                                    `INSERT INTO workspace_user (workspaceId, userId, roleId, status, createdBy, updatedBy, createdDate, updatedDate)
                                                                     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                                                                    [workspaceId, userId, roleId, 'active', userId, userId, timestamp, timestamp],
                                                                    (err) => {
                                                                        if (err) {
                                                                            console.error(`Error adding user to workspace:`, err)
                                                                            db.run('ROLLBACK')
                                                                            db.close()
                                                                            reject(err)
                                                                            return
                                                                        }

                                                                        usersCreated++

                                                                        // Check if all users are created
                                                                        if (usersCreated === totalUsers) {
                                                                            // Commit transaction
                                                                            db.run('COMMIT', (err) => {
                                                                                if (err) {
                                                                                    console.error('Error committing transaction:', err)
                                                                                    db.run('ROLLBACK')
                                                                                    db.close()
                                                                                    reject(err)
                                                                                    return
                                                                                }

                                                                                console.log('✅ Transaction committed successfully')
                                                                                console.log('\n🎉 Admin users created successfully!')
                                                                                console.log('\n' + '='.repeat(60))
                                                                                console.log('📋 LOGIN CREDENTIALS')
                                                                                console.log('='.repeat(60))
                                                                                ADMIN_USERS.forEach((user, index) => {
                                                                                    console.log(`\n${index + 1}. ${user.name}`)
                                                                                    console.log(`   Email:    ${user.email}`)
                                                                                    console.log(`   Password: ${ADMIN_PASSWORD}`)
                                                                                })
                                                                                console.log('\n' + '='.repeat(60))
                                                                                console.log('ℹ️  All users have owner/admin permissions')
                                                                                console.log('ℹ️  Users are active and ready to login')
                                                                                console.log('='.repeat(60))

                                                                                db.close((err) => {
                                                                                    if (err) {
                                                                                        console.error('Error closing database:', err)
                                                                                        reject(err)
                                                                                    } else {
                                                                                        console.log('🔌 Database connection closed')
                                                                                        console.log('✨ Seed completed!')
                                                                                        resolve()
                                                                                    }
                                                                                })
                                                                            })
                                                                        }
                                                                    }
                                                                )
                                                            }
                                                        )
                                                    }
                                                )
                                            })
                                        }
                                    )
                                }
                            )
                        }
                    )
                }
            )
        })
    })
}

// Run the seed
seedAdminUsers()
    .then(() => {
        process.exit(0)
    })
    .catch((err) => {
        console.error('❌ Fatal error:', err)
        process.exit(1)
    })
