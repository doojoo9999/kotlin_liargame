import {useEffect, useState} from 'react'
import {Button} from '@/components/ui/button'
import {Card, CardContent} from '@/components/ui/card'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from '@/components/ui/dialog'
import {FileText, Plus} from 'lucide-react'
import {useToast} from '@/hooks/useToast'
import {type Subject, subjectService} from '@/api/subjectApi'
import {wordService} from '@/api/wordApi'

interface Answer {
  id: number
  text: string
  topicId: number
  topicTitle: string
  createdAt?: string
}

export function AnswerManagementSection() {
  const [answers, setAnswers] = useState<Answer[]>([])
  const [topics, setTopics] = useState<Subject[]>([])
  const [loading, setLoading] = useState(false)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [selectedTopicId, setSelectedTopicId] = useState<string>('')
  const [newTopicName, setNewTopicName] = useState<string>('')
  const [newAnswer, setNewAnswer] = useState('')
  const { toast } = useToast()

  // 데이터 로드
  useEffect(() => {
    loadData();
  }, [])

  const loadData = async () => {
    try {
      setLoading(true);
      
      // 주제와 답안을 동시에 로드
      const [subjectsResponse, wordsResponse] = await Promise.all([
        subjectService.getSubjects(),
        wordService.getWords()
      ]);

      setTopics(subjectsResponse.subjects || []);

      // Word를 Answer 형식으로 변환하며 주제 이름 추가
      const answersWithTopics = wordsResponse.words.map(word => ({
        id: word.id,
        text: word.content,
        topicId: word.subjectId,
        topicTitle: subjectsResponse.subjects.find(s => s.id === word.subjectId)?.name || 'Unknown',
        createdAt: word.createdAt
      }));
      
      setAnswers(answersWithTopics);
    } catch (error) {
      console.error('Failed to load data:', error);
      toast({
        title: "데이터 로드 실패",
        description: "주제와 답안 목록을 불러오는 중 오류가 발생했습니다",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  const handleCreateAnswer = async () => {
    if (!newAnswer.trim()) {
      toast({
        title: "답안이 필요합니다",
        description: "답안을 입력해주세요",
        variant: "destructive",
      })
      return
    }

    // 주제명 결정 (직접 입력 또는 기존 주제 선택)
    let topicName = newTopicName.trim();
    if (!topicName && selectedTopicId) {
      const selectedTopic = topics.find(t => t.id.toString() === selectedTopicId);
      topicName = selectedTopic?.name || '';
    }

    if (!topicName) {
      toast({
        title: "주제가 필요합니다",
        description: "주제를 입력하거나 선택해주세요",
        variant: "destructive",
      })
      return
    }

    try {
      console.log('Submitting answer:', {
        content: newAnswer.trim(),
        topicName: topicName
      });
      
      // API를 통해 답안 생성 (승인 대기 상태로)
      await wordService.createWord({
        content: newAnswer.trim(),
        subjectId: topicName
      });

      setNewAnswer('')
      setSelectedTopicId('')
      setNewTopicName('')
      setIsCreateDialogOpen(false)

      toast({
        title: "답안이 제출되었습니다",
        description: `"${newAnswer.trim()}" 답안이 "${topicName}" 주제에 제출되었습니다. 관리자 승인을 기다려주세요.`,
      })

      // 데이터 새로고침 (승인된 답안만 표시되므로 개수는 즉시 변경되지 않음)
      loadData();
    } catch (error) {
      console.error('Answer submission error:', error);
      let errorMessage = "답안을 제출하는 중 오류가 발생했습니다";
      if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      toast({
        title: "답안 제출 실패",
        description: errorMessage,
        variant: "destructive",
      })
    }
  }

  const getAnswerCountByTopic = (topicId: number) => {
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
          <p className="text-muted-foreground">각 주제별 답안 현황을 확인하고 새로운 답안을 제출하세요</p>
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
                새 주제를 입력하거나 기존 주제를 선택하여 답안을 추가하세요. 관리자 승인 후 게임에 사용됩니다.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="topic">새 주제명 (직접 입력)</Label>
                <Input
                  id="topic"
                  placeholder="예: 동물, 음식, 영화 등"
                  value={newTopicName}
                  onChange={(e) => setNewTopicName(e.target.value)}
                />
              </div>

              {topics.length > 0 && (
                <div>
                  <Label>또는 기존 주제 선택</Label>
                  <Select value={selectedTopicId} onValueChange={(value) => {
                    setSelectedTopicId(value);
                    if (value) setNewTopicName(''); // 기존 주제 선택시 새 주제명 초기화
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="기존 주제에서 선택하세요 (선택사항)" />
                    </SelectTrigger>
                    <SelectContent>
                      {topics.map(topic => (
                        <SelectItem key={topic.id} value={topic.id.toString()}>
                          {topic.name} ({getAnswerCountByTopic(topic.id)}개)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

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
                  제출
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* 주제별 답안 통계 */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {loading ? (
          <div className="col-span-full text-center py-8">
            <p className="text-muted-foreground">데이터를 불러오는 중...</p>
          </div>
        ) : topics.length === 0 ? (
          <div className="col-span-full">
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">주제가 없습니다</h3>
                <p className="text-muted-foreground text-center">
                  답안을 관리하려면 먼저 주제를 생성해야 합니다
                </p>
              </CardContent>
            </Card>
          </div>
        ) : (
          topics.map(topic => (
            <Card key={topic.id}>
              <CardContent className="pt-6">
                <div className="text-center">
                  <h3 className="font-semibold">{topic.name}</h3>
                  <p className="text-2xl font-bold text-primary">
                    {getAnswerCountByTopic(topic.id)}
                  </p>
                  <p className="text-sm text-muted-foreground">개의 답안</p>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
