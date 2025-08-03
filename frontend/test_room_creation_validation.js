// Test script to validate the room creation form validation function
console.log('[DEBUG_LOG] Testing room creation validation...');

// Mock validation function (copied from LobbyPage.jsx)
const validateFormData = (data) => {
  const errors = []
  
  if (!data.title || data.title.trim().length === 0) {
    errors.push('방 제목을 입력해주세요.')
  }
  
  if (data.maxPlayers < 3 || data.maxPlayers > 15) {
    errors.push('참가자는 3명에서 15명 사이로 설정해주세요.')
  }
  
  if (data.gTotalRounds < 1 || data.gTotalRounds > 10) {
    errors.push('라운드는 1라운드에서 10라운드 사이로 설정해주세요.')
  }
  
  if (!data.subjectId) {
    errors.push('주제를 하나 이상 선택해주세요.')
  }
  
  return errors
}

// Test cases
const testCases = [
  {
    name: 'Valid form data',
    data: {
      title: 'Test Room',
      maxPlayers: 6,
      gTotalRounds: 3,
      subjectId: 1
    },
    expectedErrors: 0
  },
  {
    name: 'Empty title',
    data: {
      title: '',
      maxPlayers: 6,
      gTotalRounds: 3,
      subjectId: 1
    },
    expectedErrors: 1
  },
  {
    name: 'Invalid participant count (too low)',
    data: {
      title: 'Test Room',
      maxPlayers: 1,
      gTotalRounds: 3,
      subjectId: 1
    },
    expectedErrors: 1
  },
  {
    name: 'Invalid participant count (too high)',
    data: {
      title: 'Test Room',
      maxPlayers: 20,
      gTotalRounds: 3,
      subjectId: 1
    },
    expectedErrors: 1
  },
  {
    name: 'Invalid round count (too low)',
    data: {
      title: 'Test Room',
      maxPlayers: 6,
      gTotalRounds: 0,
      subjectId: 1
    },
    expectedErrors: 1
  },
  {
    name: 'Invalid round count (too high)',
    data: {
      title: 'Test Room',
      maxPlayers: 6,
      gTotalRounds: 15,
      subjectId: 1
    },
    expectedErrors: 1
  },
  {
    name: 'Missing subject',
    data: {
      title: 'Test Room',
      maxPlayers: 6,
      gTotalRounds: 3,
      subjectId: null
    },
    expectedErrors: 1
  },
  {
    name: 'Multiple validation errors',
    data: {
      title: '',
      maxPlayers: 1,
      gTotalRounds: 0,
      subjectId: null
    },
    expectedErrors: 4
  }
];

// Run tests
console.log('[DEBUG_LOG] Running validation tests...');
let passedTests = 0;
let totalTests = testCases.length;

testCases.forEach((testCase, index) => {
  const errors = validateFormData(testCase.data);
  const passed = errors.length === testCase.expectedErrors;
  
  console.log(`[DEBUG_LOG] Test ${index + 1}: ${testCase.name}`);
  console.log(`[DEBUG_LOG]   Expected errors: ${testCase.expectedErrors}, Got: ${errors.length}`);
  console.log(`[DEBUG_LOG]   Errors: ${errors.join(', ')}`);
  console.log(`[DEBUG_LOG]   Result: ${passed ? 'PASS' : 'FAIL'}`);
  console.log('');
  
  if (passed) passedTests++;
});

console.log(`[DEBUG_LOG] Test Results: ${passedTests}/${totalTests} tests passed`);

// Test default values
console.log('[DEBUG_LOG] Testing default values...');
const defaultFormData = {
  title: '',
  maxPlayers: 6,
  gTotalRounds: 3,
  password: '',
  subjectId: 1,
  hasPassword: false,
  gameMode: 'LIAR_KNOWS'
};

console.log('[DEBUG_LOG] Default form data:', JSON.stringify(defaultFormData, null, 2));
console.log('[DEBUG_LOG] Default maxPlayers (should be 6):', defaultFormData.maxPlayers);
console.log('[DEBUG_LOG] Default gTotalRounds (should be 3):', defaultFormData.gTotalRounds);

// Test room data transformation
console.log('[DEBUG_LOG] Testing room data transformation...');
const roomData = {
  gName: defaultFormData.title,
  gParticipants: defaultFormData.maxPlayers,
  gTotalRounds: defaultFormData.gTotalRounds,
  gPassword: defaultFormData.hasPassword ? defaultFormData.password : null,
  subjectIds: defaultFormData.subjectId ? [defaultFormData.subjectId] : null,
  useRandomSubjects: !defaultFormData.subjectId,
  randomSubjectCount: !defaultFormData.subjectId ? 1 : null
};

console.log('[DEBUG_LOG] Transformed room data:', JSON.stringify(roomData, null, 2));
console.log('[DEBUG_LOG] gParticipants (should be 6):', roomData.gParticipants);
console.log('[DEBUG_LOG] gTotalRounds (should be 3):', roomData.gTotalRounds);

console.log('[DEBUG_LOG] All tests completed!');