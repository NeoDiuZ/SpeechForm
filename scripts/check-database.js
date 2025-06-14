// Simple script to check if database tables exist
// Run with: node scripts/check-database.js

const { createClient } = require('@supabase/supabase-js')
const dotenv = require('dotenv')

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkTables() {
  console.log('Checking database tables...')
  
  try {
    // Check if subscriptions table exists
    const { data, error } = await supabase
      .from('subscriptions')
      .select('count(*)')
      .limit(1)
    
    if (error) {
      console.error('❌ Subscriptions table does not exist:', error.message)
      console.log('\n📋 Please run the SQL schema in your Supabase dashboard:')
      console.log('1. Go to Supabase Dashboard → SQL Editor')
      console.log('2. Copy and paste the content from supabase/schema-clean.sql')
      console.log('3. Click "Run" to execute the schema')
      return false
    }
    
    console.log('✅ Subscriptions table exists')
    
    // Check other tables
    const tables = ['forms', 'responses', 'api_usage']
    for (const table of tables) {
      const { error: tableError } = await supabase
        .from(table)
        .select('count(*)')
        .limit(1)
      
      if (tableError) {
        console.error(`❌ ${table} table does not exist`)
        return false
      } else {
        console.log(`✅ ${table} table exists`)
      }
    }
    
    console.log('\n🎉 All database tables are properly set up!')
    return true
    
  } catch (error) {
    console.error('Error checking database:', error)
    return false
  }
}

checkTables() 