import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const prismaClientSingleton = () => {
  let connectionString = process.env.DATABASE_URL || ''
  if (connectionString.includes('sslmode=require') && !connectionString.includes('uselibpqcompat=')) {
    connectionString = connectionString.replace('sslmode=require', 'uselibpqcompat=true&sslmode=require')
  }
  const pool = new Pool({ connectionString })
  const adapter = new PrismaPg(pool)
  return new PrismaClient({ adapter })
}

declare const globalThis: {
  prismaGlobal: ReturnType<typeof prismaClientSingleton>;
} & typeof global;

let prisma = globalThis.prismaGlobal ?? prismaClientSingleton()

// Si el singleton en memoria fue instanciado antes de agregar nuevos modelos (ej. pushSubscription), refrescarlo
if (prisma && !(prisma as any).pushSubscription) {
  prisma = prismaClientSingleton()
  globalThis.prismaGlobal = prisma
}

export default prisma

if (process.env.NODE_ENV !== 'production') globalThis.prismaGlobal = prisma
