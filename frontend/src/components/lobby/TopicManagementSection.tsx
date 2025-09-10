import {useEffect, useRef, useState} from 'react'
import {Button} from '@/components/ui/button'
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from '@/components/ui/card'
import {Input} from '@/components/ui/input'
import {Label} from '@/components/ui/label'
import {Textarea} from '@/components/ui/textarea'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from '@/components/ui/dialog'
import {BookOpen, Edit, Plus, Trash2} from 'lucide-react'
import {useToast} from '@/hooks/useToast'
import {Subject, subjectService} from '@/api/subjectApi'

// Subject 타입을 API에서 가져와 사용

export function TopicManagementSection() {
  const [topics, setTopics] = useState<Subject[]>([])
  const [loading, setLoading] = useState(false)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [newTopic, setNewTopic] = useState({
    title: '',
    description: ''
  })
  const { toast } = useToast()
  const titleInputRef = useRef<HTMLInputElement>(null)

  // 주제 목록 로드
  useEffect(() => {
    loadTopics();
  }, [])

  const loadTopics = async () => {
    try {
      setLoading(true);
      const response = await subjectService.getSubjects();
      setTopics(response.subjects || []);
    } catch (error) {
      console.error('Failed to load topics:', error);
      toast({
        title: "주제 로드 실패",
        description: "주제 목록을 불러오는 중 오류가 발생했습니다",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  const handleCreateTopic = async () => {
    if (!newTopic.title.trim()) {
      toast({
        title: "제목이 필요합니다",
        description: "주제 제목을 입력해주세요",
        variant: "destructive",
      })
      titleInputRef.current?.focus();
      return
    }

    try {
      const createdTopic = await subjectService.createSubject({
        name: newTopic.title.trim() // 백엔드에서 기대하는 name 필드 사용
      });

      setTopics(prev => [...prev, createdTopic]);
      setNewTopic({ title: '', description: '' });
      
      // 연속 추가를 위해 모달을 닫지 않고 포커스 유지
      titleInputRef.current?.focus();

      toast({
        title: "주제가 생성되었습니다",
        description: `"${createdTopic.title}" 주제가 추가되었습니다`,
      });
    } catch (error) {
      console.error('Create topic error:', error);
      toast({
        title: "주제 생성 실패",
        description: "주제를 생성하는 중 오류가 발생했습니다",
        variant: "destructive",
      });
    }
  }

  const handleDeleteTopic = async (topicId: number) => {
    try {
      await subjectService.deleteSubject(topicId);
      setTopics(prev => prev.filter(topic => topic.id !== topicId));

      toast({
        title: "주제가 삭제되었습니다",
        description: "주제가 성공적으로 삭제되었습니다",
      });
    } catch (error) {
      console.error('Delete topic error:', error);
      toast({
        title: "주제 삭제 실패",
        description: "주제를 삭제하는 중 오류가 발생했습니다",
        variant: "destructive",
      });
    }
  }

  // Enter 키 핸들러
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleCreateTopic();
    }
  }

  // 모달 열릴 때 입력 필드에 포커스
  const handleDialogOpen = (open: boolean) => {
    setIsCreateDialogOpen(open);
    if (open) {
      setTimeout(() => titleInputRef.current?.focus(), 100);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <BookOpen className="h-6 w-6" />
            주제 관리
          </h2>
          <p className="text-muted-foreground">게임에 사용할 주제를 관리하세요</p>
        </div>

        <Dialog open={isCreateDialogOpen} onOpenChange={handleDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              새 주제 추가
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>새 주제 추가</DialogTitle>
              <DialogDescription>
                게임에 사용할 새로운 주제를 추가하세요 (Enter로 빠른 추가)
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">주제 제목</Label>
                <Input
                  ref={titleInputRef}
                  id="title"
                  placeholder="예: 동물, 음식, 영화 등"
                  value={newTopic.title}
                  onChange={(e) => setNewTopic(prev => ({ ...prev, title: e.target.value }))}
                  onKeyPress={handleKeyPress}
                  autoFocus
                />
              </div>
              <div>
                <Label htmlFor="description">설명 (선택사항)</Label>
                <Textarea
                  id="description"
                  placeholder="주제에 대한 간단한 설명"
                  value={newTopic.description}
                  onChange={(e) => setNewTopic(prev => ({ ...prev, description: e.target.value }))}
                  onKeyPress={handleKeyPress}
                />
              </div>
              <div className="flex gap-2 justify-between">
                <div className="text-sm text-muted-foreground">
                  💡 Enter 키로 빠르게 추가하고 계속 입력하세요
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    완료
                  </Button>
                  <Button onClick={handleCreateTopic}>
                    추가
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {topics.map((topic) => (
          <Card key={topic.id}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{topic.title}</CardTitle>
                  {topic.description && (
                    <CardDescription className="mt-1">
                      {topic.description}
                    </CardDescription>
                  )}
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteTopic(topic.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  답안 {topic.wordCount || 0}개
                </span>
                <span className="text-xs text-muted-foreground">
                  {new Date(topic.createdAt).toLocaleDateString()}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}

        {topics.length === 0 && (
          <Card className="col-span-full">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">아직 주제가 없습니다</h3>
              <p className="text-muted-foreground text-center mb-4">
                첫 번째 주제를 추가하여 게임을 시작해보세요
              </p>
              <Button onClick={() => handleDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                첫 주제 추가하기
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
