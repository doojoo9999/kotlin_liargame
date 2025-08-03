/**
 * Test script to reproduce the subject registration toLowerCase error
 * This simulates the scenario where API returns subjects with undefined name property
 */

console.log('=== Subject Registration Error Reproduction Test ===')

// Simulate different API response scenarios
const testScenarios = [
  {
    name: 'Valid subjects (dummy data format)',
    subjects: [
      { id: 1, name: '동물' },
      { id: 2, name: '음식' },
      { id: 3, name: '영화' }
    ]
  },
  {
    name: 'Invalid subjects (missing name property)',
    subjects: [
      { id: 1 }, // Missing name property
      { id: 2, name: '음식' },
      { id: 3, name: null } // null name
    ]
  },
  {
    name: 'Invalid subjects (undefined name)',
    subjects: [
      { id: 1, name: undefined },
      { id: 2, name: '음식' },
      { id: 3, name: '' } // empty name
    ]
  },
  {
    name: 'Mixed valid/invalid subjects',
    subjects: [
      { id: 1, name: '동물' },
      { id: 2 }, // Missing name
      { id: 3, name: '영화' },
      { id: 4, name: null }
    ]
  }
]

// Simulate the problematic code from LobbyPage.jsx line 242
function testSubjectRegistration(subjects, newSubject) {
  console.log(`\n--- Testing with: ${newSubject} ---`)
  console.log('Subjects:', JSON.stringify(subjects, null, 2))
  
  try {
    // This is the problematic line from LobbyPage.jsx:242
    const existingSubject = subjects.find(s => s.name.toLowerCase() === newSubject.trim().toLowerCase())
    
    if (existingSubject) {
      console.log('✅ Found existing subject:', existingSubject)
      return { success: true, message: '이미 존재하는 주제입니다.' }
    } else {
      console.log('✅ No existing subject found, can proceed with registration')
      return { success: true, message: '주제 등록 가능' }
    }
  } catch (error) {
    console.log('❌ ERROR:', error.message)
    return { success: false, error: error.message }
  }
}

// Test safe version
function testSafeSubjectRegistration(subjects, newSubject) {
  console.log(`\n--- Testing SAFE version with: ${newSubject} ---`)
  console.log('Subjects:', JSON.stringify(subjects, null, 2))
  
  try {
    // Safe version with proper validation
    const existingSubject = subjects.find(s => 
      s && 
      s.name && 
      typeof s.name === 'string' && 
      s.name.toLowerCase() === newSubject.trim().toLowerCase()
    )
    
    if (existingSubject) {
      console.log('✅ Found existing subject:', existingSubject)
      return { success: true, message: '이미 존재하는 주제입니다.' }
    } else {
      console.log('✅ No existing subject found, can proceed with registration')
      return { success: true, message: '주제 등록 가능' }
    }
  } catch (error) {
    console.log('❌ ERROR:', error.message)
    return { success: false, error: error.message }
  }
}

// Run tests
console.log('\n🔍 Testing ORIGINAL (problematic) implementation:')
testScenarios.forEach(scenario => {
  console.log(`\n=== ${scenario.name} ===`)
  testSubjectRegistration(scenario.subjects, '동물')
  testSubjectRegistration(scenario.subjects, '새로운주제')
})

console.log('\n\n🛡️ Testing SAFE implementation:')
testScenarios.forEach(scenario => {
  console.log(`\n=== ${scenario.name} ===`)
  testSafeSubjectRegistration(scenario.subjects, '동물')
  testSafeSubjectRegistration(scenario.subjects, '새로운주제')
})

console.log('\n=== Test Complete ===')