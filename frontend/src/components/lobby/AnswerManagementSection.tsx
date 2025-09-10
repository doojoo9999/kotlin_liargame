import {useState} from 'react'
import {Button} from '@/components/ui/button'
import {Card, CardContent} from '@/components/ui/card'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {Badge} from '@/components/ui/badge'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from '@/components/ui/dialog'
import {FileText, Plus, Search, Trash2} from 'lucide-react'
import {useToast} from '@/hooks/useToast'

interface Answer {
  id: string
  text: string
  topicId: string
  topicTitle: string
  createdAt: string
}

interface Topic {
  id: string
  title: string
}

export function AnswerManagementSection() {
  const [answers, setAnswers] = useState<Answer[]>([])
  const [topics] = useState<Topic[]>([
    { id: '1', title: '동물' },
    { id: '2', title: '음식' },
    { id: '3', title: '영화' }
  ]) // TODO: 실제 주제 목록 가져오기

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [selectedTopicId, setSelectedTopicId] = useState<string>('')
  const [filterTopicId, setFilterTopicId] = useState<string>('all')
  const [newAnswer, setNewAnswer] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const { toast } = useToast()

  const filteredAnswers = answers.filter(answer => {
    const matchesFilter = filterTopicId === 'all' || answer.topicId === filterTopicId
    const matchesSearch = answer.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         answer.topicTitle.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesFilter && matchesSearch
  })

  const handleCreateAnswer = async () => {
    if (!newAnswer.trim()) {
      toast({
        title: "답안이 필요합니다",
        description: "답안을 입력해주세요",
        variant: "destructive",
      })
      return
    }

    if (!selectedTopicId) {
      toast({
        title: "주제를 선택해주세요",
        description: "답안을 추가할 주제를 선택해주세요",
        variant: "destructive",
      })
      return
    }

    // 중복 답안 확인
    const isDuplicate = answers.some(
      answer => answer.text.toLowerCase() === newAnswer.trim().toLowerCase() &&
                answer.topicId === selectedTopicId
    )

    if (isDuplicate) {
      toast({
        title: "중복된 답안입니다",
        description: "이미 같은 주제에 동일한 답안이 있습니다",
        variant: "destructive",
      })
      return
    }

    try {
      const selectedTopic = topics.find(t => t.id === selectedTopicId)
      const answer: Answer = {
        id: Date.now().toString(),
        text: newAnswer.trim(),
        topicId: selectedTopicId,
        topicTitle: selectedTopic?.title || '',
        createdAt: new Date().toISOString()
      }

      setAnswers(prev => [...prev, answer])
      setNewAnswer('')
      setSelectedTopicId('')
      setIsCreateDialogOpen(false)

      toast({
        title: "답안이 추가되었습니다",
        description: `"${answer.text}" 답안이 ${answer.topicTitle} 주제에 추가되었습니다`,
      })
    } catch (error) {
      toast({
        title: "답안 추가 실패",
        description: "답안을 추가하는 중 오류가 발생했습니다",
        variant: "destructive",
      })
    }
  }

  const handleDeleteAnswer = async (answerId: string) => {
    try {
      setAnswers(prev => prev.filter(answer => answer.id !== answerId))

      toast({
        title: "답안이 삭제되었습니다",
        description: "답안이 성공적으로 삭제되었습니다",
      })
    } catch (error) {
      toast({
        title: "답안 삭제 실패",
        description: "답안을 삭제하는 중 오류가 발생했습니다",
        variant: "destructive",
      })
    }
  }

  const getAnswerCountByTopic = (topicId: string) => {
    return answers.filter(answer => answer.topicId === topicId).length
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="h-6 w-6" />
            답안 관리
          </h2>
          <p className="text-muted-foreground">각 주제별 답안을 관리하세요</p>
        </div>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              새 답안 추가
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>새 답안 추가</DialogTitle>
              <DialogDescription>
                선택한 주제에 새로운 답안을 추가하세요
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="topic">주제</Label>
                <Select value={selectedTopicId} onValueChange={setSelectedTopicId}>
                  <SelectTrigger>
                    <SelectValue placeholder="주제를 선택하세요" />
                  </SelectTrigger>
                  <SelectContent>
                    {topics.map(topic => (
                      <SelectItem key={topic.id} value={topic.id}>
                        {topic.title} ({getAnswerCountByTopic(topic.id)}개)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="answer">답안</Label>
                <Input
                  id="answer"
                  placeholder="예: 사자, 피자, 타이타닉 등"
                  value={newAnswer}
                  onChange={(e) => setNewAnswer(e.target.value)}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  취소
                </Button>
                <Button onClick={handleCreateAnswer}>
                  추가
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* 필터 및 검색 */}
      <div className="flex gap-4 items-center">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="답안 또는 주제 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div className="w-48">
          <Select value={filterTopicId} onValueChange={setFilterTopicId}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">모든 주제</SelectItem>
              {topics.map(topic => (
                <SelectItem key={topic.id} value={topic.id.toString()}>
                  {topic.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 주제별 답안 통계 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {topics.map(topic => (
          <Card key={topic.id}>
            <CardContent className="pt-6">
              <div className="text-center">
                <h3 className="font-semibold">{topic.title}</h3>
                <p className="text-2xl font-bold text-primary">
                  {getAnswerCountByTopic(topic.id)}
                </p>
                <p className="text-sm text-muted-foreground">개의 답안</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 답안 목록 */}
      <div className="space-y-2">
        {filteredAnswers.map((answer) => (
          <Card key={answer.id}>
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="font-medium">{answer.text}</span>
                  <Badge variant="outline">{answer.topicTitle}</Badge>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteAnswer(answer.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredAnswers.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                {answers.length === 0 ? "아직 답안이 없습니다" : "검색 결과가 없습니다"}
              </h3>
              <p className="text-muted-foreground text-center mb-4">
                {answers.length === 0
                  ? "첫 번째 답안을 추가하여 게임을 준비해보세요"
                  : "다른 검색어를 시도해보세요"
                }
              </p>
              {answers.length === 0 && (
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  첫 답안 추가하기
                </Button>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
