import React, {useEffect, useState} from 'react'
import {Card, CardContent, CardHeader, CardTitle} from '@/components/ui/card'
import {Button} from '@/components/ui/button'
import {Badge} from '@/components/ui/badge'
import {Input} from '@/components/ui/input'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from '@/components/ui/dialog'
import {Alert, AlertDescription} from '@/components/ui/alert'
import {AlertCircle, BookOpen, Clock, Eye, EyeOff, Plus, Trash2} from 'lucide-react'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue,} from '@/components/ui/select'

export interface Topic {
  id: number
  title: string
  answers: string[]
  difficulty: 'EASY' | 'MEDIUM' | 'HARD'
  category: string
  isApproved: boolean
  createdBy?: string
  usageCount: number
}

export interface TopicManagementPanelProps {
  gameNumber: number
  isOwner?: boolean
  canManageTopics?: boolean
}

export const TopicManagementPanel: React.FC<TopicManagementPanelProps> = ({
  gameNumber,
  isOwner,
  canManageTopics = false
}) => {
  const [topics, setTopics] = useState<Topic[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isAddingTopic, setIsAddingTopic] = useState(false)
  const [showAnswers, setShowAnswers] = useState<Record<number, boolean>>({})
  
  // 새 주제 추가 폼 상태
  const [newTopic, setNewTopic] = useState({
    title: '',
    answers: [''],
    difficulty: 'MEDIUM' as const,
    category: ''
  })

  useEffect(() => {
    loadTopics()
  }, [gameNumber])

  const loadTopics = async () => {
    setLoading(true)
    try {
      // TODO: API 연동
      const mockTopics: Topic[] = [
        {
          id: 1,
          title: '동물',
          answers: ['개', '고양이', '사자', '코끼리', '기린'],
          difficulty: 'EASY',
          category: '일반',
          isApproved: true,
          usageCount: 125
        },
        {
          id: 2,
          title: '한국의 음식',
          answers: ['김치', '불고기', '비빔밥', '떡볶이', '삼겹살'],
          difficulty: 'MEDIUM',
          category: '음식',
          isApproved: true,
          usageCount: 89
        },
        {
          id: 3,
          title: '프로그래밍 언어',
          answers: ['JavaScript', 'Python', 'Java', 'C++', 'Go'],
          difficulty: 'HARD',
          category: 'IT',
          isApproved: false,
          usageCount: 12
        }
      ]
      setTopics(mockTopics)
      setError(null)
    } catch (err) {
      console.error('Failed to load topics:', err)
      setError('주제를 불러올 수 없습니다.')
    } finally {
      setLoading(false)
    }
  }

  const handleAddAnswer = () => {
    setNewTopic(prev => ({
      ...prev,
      answers: [...prev.answers, '']
    }))
  }

  const handleRemoveAnswer = (index: number) => {
    setNewTopic(prev => ({
      ...prev,
      answers: prev.answers.filter((_, i) => i !== index)
    }))
  }

  const handleAnswerChange = (index: number, value: string) => {
    setNewTopic(prev => ({
      ...prev,
      answers: prev.answers.map((answer, i) => i === index ? value : answer)
    }))
  }

  const handleSubmitTopic = async () => {
    if (!newTopic.title.trim() || newTopic.answers.filter(a => a.trim()).length < 3) {
      setError('주제 제목과 최소 3개의 답안을 입력해주세요.')
      return
    }

    setLoading(true)
    try {
      // TODO: API 연동
      console.log('Submitting topic:', newTopic)
      
      // 폼 초기화
      setNewTopic({
        title: '',
        answers: [''],
        difficulty: 'MEDIUM',
        category: ''
      })
      setIsAddingTopic(false)
      setError(null)
      
      // 목록 새로고침
      await loadTopics()
    } catch (error) {
      console.error('Failed to submit topic:', error);
      setError('주제를 추가할 수 없습니다.')
    } finally {
      setLoading(false)
    }
  }

  const toggleShowAnswers = (topicId: number) => {
    setShowAnswers(prev => ({
      ...prev,
      [topicId]: !prev[topicId]
    }))
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'EASY': return 'bg-green-100 text-green-800'
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800'
      case 'HARD': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getDifficultyText = (difficulty: string) => {
    switch (difficulty) {
      case 'EASY': return '쉬움'
      case 'MEDIUM': return '보통'
      case 'HARD': return '어려움'
      default: return difficulty
    }
  }

  return (
    <Card>
      <CardHeader className="pb-2 sm:pb-3">
        <CardTitle className="flex items-center justify-between text-sm sm:text-base">
          <div className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            주제 관리
            <Badge variant="secondary" className="ml-2">
              {topics.length}개
            </Badge>
          </div>
          
          {(isOwner || canManageTopics) && (
            <Dialog open={isAddingTopic} onOpenChange={setIsAddingTopic}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                  <Plus className="h-4 w-4 mr-1" />
                  <span className="hidden sm:inline">주제 추가</span>
                  <span className="sm:hidden">추가</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>새 주제 추가</DialogTitle>
                  <DialogDescription>
                    게임에서 사용할 새로운 주제를 추가합니다.
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">주제 제목</label>
                    <Input
                      value={newTopic.title}
                      onChange={(e) => setNewTopic(prev => ({...prev, title: e.target.value}))}
                      placeholder="예: 동물, 음식, 영화 등"
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">카테고리</label>
                    <Input
                      value={newTopic.category}
                      onChange={(e) => setNewTopic(prev => ({...prev, category: e.target.value}))}
                      placeholder="예: 일반, 음식, 스포츠 등"
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">난이도</label>
                    <Select 
                      value={newTopic.difficulty} 
                      onValueChange={(value: any) => setNewTopic(prev => ({...prev, difficulty: value}))}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="EASY">쉬움</SelectItem>
                        <SelectItem value="MEDIUM">보통</SelectItem>
                        <SelectItem value="HARD">어려움</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">답안 목록</label>
                      <Button 
                        type="button" 
                        size="sm" 
                        variant="outline" 
                        onClick={handleAddAnswer}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        추가
                      </Button>
                    </div>
                    <div className="space-y-2 mt-1">
                      {newTopic.answers.map((answer, index) => (
                        <div key={index} className="flex gap-2">
                          <Input
                            value={answer}
                            onChange={(e) => handleAnswerChange(index, e.target.value)}
                            placeholder={`답안 ${index + 1}`}
                          />
                          {newTopic.answers.length > 1 && (
                            <Button 
                              type="button"
                              size="sm" 
                              variant="outline"
                              onClick={() => handleRemoveAnswer(index)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex gap-2 pt-4">
                    <Button 
                      onClick={handleSubmitTopic} 
                      disabled={loading}
                      className="flex-1"
                    >
                      추가
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setIsAddingTopic(false)}
                      className="flex-1"
                    >
                      취소
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-3">
        {error && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs sm:text-sm">{error}</AlertDescription>
          </Alert>
        )}
        
        <div className="space-y-3">
          {loading ? (
            <div className="text-center text-sm text-muted-foreground py-4">
              주제를 불러오는 중...
            </div>
          ) : topics.length === 0 ? (
            <div className="text-center text-sm text-muted-foreground py-4">
              등록된 주제가 없습니다.
            </div>
          ) : (
            topics.map((topic) => (
              <div key={topic.id} className="border rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{topic.title}</span>
                    <Badge className={getDifficultyColor(topic.difficulty)}>
                      {getDifficultyText(topic.difficulty)}
                    </Badge>
                    {!topic.isApproved && (
                      <Badge variant="destructive">
                        <Clock className="h-3 w-3 mr-1" />
                        승인 대기
                      </Badge>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => toggleShowAnswers(topic.id)}
                    aria-label={showAnswers[topic.id] ? '답안 숨기기' : '답안 보기'}
                  >
                    {showAnswers[topic.id] ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>카테고리: {topic.category}</span>
                  <span>사용 횟수: {topic.usageCount}회</span>
                </div>
                
                {showAnswers[topic.id] && (
                  <div className="space-y-1">
                    <div className="text-xs font-medium text-gray-600">
                      답안 목록 ({topic.answers.length}개)
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {topic.answers.map((answer, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {answer}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
        
        <div className="text-xs text-muted-foreground pt-2 border-t">
          💡 팁: 답안 내용은 게임 중에만 공개되며, 평소에는 개수만 표시됩니다.
        </div>
      </CardContent>
    </Card>
  )
}