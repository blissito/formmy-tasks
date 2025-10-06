#!/usr/bin/env node
/**
 * Seed Admin Users Script for m-flows
 *
 * This script creates 3 admin users with full permissions.
 * Run this AFTER the first deployment via SSH:
 *
 * flyctl ssh console --app m-flows
 * cd /app && node seed-admin-users.js
 */

const { DataSource } = require('typeorm')
const bcrypt = require('bcryptjs')
const { v4: uuidv4 } = require('uuid')
const path = require('path')

// Database configuration
const DATABASE_PATH = process.env.DATABASE_PATH || '/data/database.sqlite'

// Users to create
const ADMIN_USERS = [
    {
        email: 'carlosfructuosopliegoorihuela@gmail.com',
        name: 'Carlos Fructuoso'
    },
    {
        email: 'jlcarrascocomonfort@gmail.com',
        name: 'José Luis Carrasco'
    },
    {
        email: 'mcarrascocomonfort@gmail.com',
        name: 'María Carrasco'
    }
]

const ADMIN_PASSWORD = 'Agentes2025@'

// Hash password
function hashPassword(password) {
    const salt = bcrypt.genSaltSync(10)
    return bcrypt.hashSync(password, salt)
}

async function seedAdminUsers() {
    console.log('🚀 Starting admin users seed...')
    console.log(`📁 Database path: ${DATABASE_PATH}`)

    // Initialize DataSource
    const AppDataSource = new DataSource({
        type: 'sqlite',
        database: DATABASE_PATH,
        synchronize: false,
        entities: [
            path.join(__dirname, 'packages/server/dist/database/entities/**/*.js'),
            path.join(__dirname, 'packages/server/dist/enterprise/database/entities/**/*.js')
        ],
        migrations: [
            path.join(__dirname, 'packages/server/dist/database/migrations/sqlite/**/*.js')
        ]
    })

    try {
        await AppDataSource.initialize()
        console.log('✅ Database connection established')

        const queryRunner = AppDataSource.createQueryRunner()
        await queryRunner.connect()
        await queryRunner.startTransaction()

        try {
            const hashedPassword = hashPassword(ADMIN_PASSWORD)
            console.log('🔐 Password hashed successfully')

            // Check if users already exist
            const existingUsers = await queryRunner.manager.query(
                `SELECT email FROM user WHERE email IN (?, ?, ?)`,
                ADMIN_USERS.map(u => u.email)
            )

            if (existingUsers.length > 0) {
                console.log('⚠️  Some users already exist:')
                existingUsers.forEach(u => console.log(`   - ${u.email}`))
                console.log('Skipping user creation. Use "pnpm user" to reset passwords.')
                await queryRunner.rollbackTransaction()
                return
            }

            // Create organization
            const orgId = uuidv4()
            const firstUserId = uuidv4()

            console.log('📦 Creating Default Organization...')
            await queryRunner.manager.query(
                `INSERT INTO organization (id, name, createdBy, updatedBy, createdDate, updatedDate)
                 VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))`,
                [orgId, 'Default Organization', firstUserId, firstUserId]
            )

            // Create owner role
            const roleId = uuidv4()
            console.log('👑 Creating Owner Role...')

            const ownerPermissions = JSON.stringify({
                canRead: true,
                canWrite: true,
                canDelete: true,
                canManageUsers: true,
                canManageSettings: true,
                isOwner: true
            })

            await queryRunner.manager.query(
                `INSERT INTO role (id, organizationId, name, description, permissions, createdBy, updatedBy, createdDate, updatedDate)
                 VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
                [roleId, orgId, 'owner', 'Organization Owner', ownerPermissions, firstUserId, firstUserId]
            )

            // Create workspace
            const workspaceId = uuidv4()
            console.log('🏢 Creating Default Workspace...')
            await queryRunner.manager.query(
                `INSERT INTO workspace (id, organizationId, name, description, createdBy, updatedBy, createdDate, updatedDate)
                 VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
                [workspaceId, orgId, 'Default Workspace', 'Main workspace for m-flows', firstUserId, firstUserId]
            )

            // Create users
            const userIds = []
            for (let i = 0; i < ADMIN_USERS.length; i++) {
                const user = ADMIN_USERS[i]
                const userId = i === 0 ? firstUserId : uuidv4()
                userIds.push(userId)

                console.log(`👤 Creating user: ${user.email}`)
                await queryRunner.manager.query(
                    `INSERT INTO user (id, name, email, credential, status, createdBy, updatedBy, createdDate, updatedDate)
                     VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
                    [userId, user.name, user.email, hashedPassword, 'active', userId, userId]
                )

                // Add user to organization
                await queryRunner.manager.query(
                    `INSERT INTO organization_user (organizationId, userId, roleId, status, createdBy, updatedBy, createdDate, updatedDate)
                     VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
                    [orgId, userId, roleId, 'active', userId, userId]
                )

                // Add user to workspace
                await queryRunner.manager.query(
                    `INSERT INTO workspace_user (workspaceId, userId, roleId, status, createdBy, updatedBy, createdDate, updatedDate)
                     VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
                    [workspaceId, userId, roleId, 'active', userId, userId]
                )
            }

            await queryRunner.commitTransaction()
            console.log('✅ Transaction committed successfully')

            console.log('\n🎉 Admin users created successfully!')
            console.log('\n📋 Login credentials:')
            ADMIN_USERS.forEach(user => {
                console.log(`   Email: ${user.email}`)
                console.log(`   Password: ${ADMIN_PASSWORD}`)
                console.log('')
            })

            console.log('🌐 Access at: https://m-flows.fly.dev')

        } catch (error) {
            await queryRunner.rollbackTransaction()
            throw error
        } finally {
            await queryRunner.release()
        }

    } catch (error) {
        console.error('❌ Error seeding admin users:', error)
        process.exit(1)
    } finally {
        if (AppDataSource.isInitialized) {
            await AppDataSource.destroy()
            console.log('🔌 Database connection closed')
        }
    }

    console.log('✨ Seed completed!')
    process.exit(0)
}

// Run the seed
seedAdminUsers()
