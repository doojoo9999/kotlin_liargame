import React, {useState} from 'react'
import PropTypes from 'prop-types'
import {Button, Group, Modal, Select, Stack, Text, TextInput} from '@mantine/core'
import {IconBook, IconBulb, IconPlus} from '@tabler/icons-react'
import {motion} from 'framer-motion'

export function AddContentDialog({ 
  opened, 
  onClose, 
  subjects = [],
  addSubject,
  addWord,
  loading
}) {
  // 상태 관리
  const [activeTab, setActiveTab] = useState('subject') // 'subject' | 'word'
  const [subjectName, setSubjectName] = useState('')
  const [selectedSubject, setSelectedSubject] = useState('')
  const [wordText, setWordText] = useState('')

  // 핸들러 함수들
  const handleAddSubject = async () => {
    if (!subjectName.trim()) return
    await addSubject(subjectName.trim(), () => setSubjectName(''))
  }

  const handleAddWord = async () => {
    if (!selectedSubject || !wordText.trim()) return
    await addWord(selectedSubject, wordText.trim(), () => setWordText(''))
  }

  // LoginPage-consistent input field styles
  const inputStyles = {
    label: { 
      color: 'white', 
      marginBottom: '8px',
      fontSize: '14px',
      fontWeight: 500
    },
    input: {
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      borderColor: 'rgba(255, 255, 255, 0.3)',
      borderRadius: '8px',
      color: 'white',
      fontSize: '14px',
      padding: '12px 16px',
      height: '48px',
      '&::placeholder': { 
        color: 'rgba(255, 255, 255, 0.5)' 
      },
      '&:focus': {
        borderColor: '#667eea',
        boxShadow: '0 0 0 2px rgba(102, 126, 234, 0.2)'
      }
    }
  }

  const canSubmit = activeTab === 'subject' ? subjectName.trim() : selectedSubject && wordText.trim()

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="🎮 콘텐츠 추가"
      centered
      size="md"
      styles={{
        content: {
          background: 'rgba(45, 55, 72, 0.95)',
          borderRadius: '24px',
          padding: '40px 32px',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          color: 'white',
          width: '580px',
          maxWidth: '580px',
          minWidth: '580px'
        },
        header: {
          backgroundColor: 'transparent',
          borderBottom: 'none',
          padding: '0 0 24px 0'
        },
        title: {
          color: 'white',
          fontSize: '20px',
          fontWeight: 'bold',
          textAlign: 'center'
        }
      }}
    >
      <Stack gap="24px">
        {/* LoginPage-consistent gradient tab buttons */}
        <Group grow mb="32px">
          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button
              variant={activeTab === 'subject' ? 'gradient' : 'outline'}
              gradient={{ from: 'violet', to: 'purple' }}
              leftSection={<IconBook size={16} />}
              onClick={() => setActiveTab('subject')}
              size="md"
              fullWidth
              styles={{
                root: {
                  height: '48px',
                  borderColor: 'rgba(255, 255, 255, 0.3)',
                  color: activeTab === 'subject' ? 'white' : 'rgba(255, 255, 255, 0.8)',
                  fontSize: '14px',
                  fontWeight: 500
                }
              }}
            >
              📚 새 주제 추가
            </Button>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Button
              variant={activeTab === 'word' ? 'gradient' : 'outline'}
              gradient={{ from: 'cyan', to: 'teal' }}
              leftSection={<IconBulb size={16} />}
              onClick={() => setActiveTab('word')}
              size="md"
              fullWidth
              styles={{
                root: {
                  height: '48px',
                  borderColor: 'rgba(255, 255, 255, 0.3)',
                  color: activeTab === 'word' ? 'white' : 'rgba(255, 255, 255, 0.8)',
                  fontSize: '14px',
                  fontWeight: 500
                }
              }}
            >
              💡 답안 추가
            </Button>
          </motion.div>
        </Group>

        {/* Enhanced description text */}
        <Text 
          size="sm" 
          c="dimmed" 
          ta="center"
          style={{ 
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            padding: '12px',
            borderRadius: '8px',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}
        >
          {activeTab === 'subject' 
            ? '🎯 게임에서 사용할 새로운 주제 카테고리를 만들어보세요!'
            : '📝 기존 주제에 다양한 답안을 추가해서 게임을 더 재미있게 만들어보세요!'
          }
        </Text>

        {/* 새 주제 추가 탭 */}
        {activeTab === 'subject' && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Stack gap="20px">
              <TextInput
                label="주제 이름"
                placeholder="예: 음식, 동물, 영화 등..."
                value={subjectName}
                onChange={(e) => setSubjectName(e.target.value)}
                styles={inputStyles}
                size="md"
              />
              
              <Button
                leftSection={<IconPlus size={16} />}
                disabled={!canSubmit}
                onClick={handleAddSubject}
                variant="gradient"
                gradient={{ from: 'violet', to: 'purple' }}
                size="md"
                fullWidth
                styles={{
                  root: {
                    height: '48px',
                    fontSize: '14px',
                    fontWeight: 600,
                    marginTop: '16px'
                  }
                }}
              >
                ✨ 주제 추가
              </Button>
            </Stack>
          </motion.div>
        )}

        {/* 답안 추가 탭 */}
        {activeTab === 'word' && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Stack gap="20px">
              <Select
                label="주제 선택"
                placeholder="주제를 선택하세요"
                data={subjects.map(s => ({ value: (s.name || s.content), label: (s.name || s.content) }))}
                value={selectedSubject}
                onChange={setSelectedSubject}
                searchable
                size="md"
                styles={{
                  ...inputStyles,
                  dropdown: {
                    backgroundColor: 'rgba(45, 55, 72, 0.95)',
                    borderColor: 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(20px)'
                  },
                  option: {
                    color: 'white',
                    backgroundColor: 'transparent',
                    '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.1)' }
                  }
                }}
              />
              
              <TextInput
                label="답안"
                placeholder="새로운 답안을 입력하세요..."
                value={wordText}
                onChange={(e) => setWordText(e.target.value)}
                disabled={!selectedSubject}
                styles={inputStyles}
                size="md"
              />
              
              <Button
                leftSection={<IconPlus size={16} />}
                disabled={!canSubmit || loading}
                loading={loading}
                onClick={handleAddWord}
                variant="gradient"
                gradient={{ from: 'cyan', to: 'teal' }}
                size="md"
                fullWidth
                styles={{
                  root: {
                    height: '48px',
                    fontSize: '14px',
                    fontWeight: 600,
                    marginTop: '16px'
                  }
                }}
              >
                💫 답안 추가
              </Button>
            </Stack>
          </motion.div>
        )}
      </Stack>
    </Modal>
  )
}

AddContentDialog.propTypes = {
  opened: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  subjects: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    name: PropTypes.string,
    content: PropTypes.string,
  })),
  addSubject: PropTypes.func.isRequired,
  addWord: PropTypes.func.isRequired,
  loading: PropTypes.bool,
}

AddContentDialog.defaultProps = {
  subjects: [],
  loading: false,
}

export default AddContentDialog