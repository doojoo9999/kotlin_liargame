import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import { Plus, Edit, Trash2, BookOpen } from 'lucide-react'
import { useToast } from '@/hooks/useToast'

interface Topic {
  id: string
  title: string
  description?: string
  category: string
  answerCount: number
  createdAt: string
}

export function TopicManagementSection() {
  const [topics, setTopics] = useState<Topic[]>([])
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [newTopic, setNewTopic] = useState({
    title: '',
    description: '',
    category: '일반'
  })
  const { toast } = useToast()

  const handleCreateTopic = async () => {
    if (!newTopic.title.trim()) {
      toast({
        title: "제목이 필요합니다",
        description: "주제 제목을 입력해주세요",
        variant: "destructive",
      })
      return
    }

    try {
      // TODO: API 호출로 주제 생성
      const topic: Topic = {
        id: Date.now().toString(),
        title: newTopic.title.trim(),
        description: newTopic.description.trim(),
        category: newTopic.category,
        answerCount: 0,
        createdAt: new Date().toISOString()
      }

      setTopics(prev => [...prev, topic])
      setNewTopic({ title: '', description: '', category: '일반' })
      setIsCreateDialogOpen(false)

      toast({
        title: "주제가 생성되었습니다",
        description: `"${topic.title}" 주제가 추가되었습니다`,
      })
    } catch (error) {
      toast({
        title: "주제 생성 실패",
        description: "주제를 생성하는 중 오류가 발생했습니다",
        variant: "destructive",
      })
    }
  }

  const handleDeleteTopic = async (topicId: string) => {
    try {
      // TODO: API 호출로 주제 삭제
      setTopics(prev => prev.filter(topic => topic.id !== topicId))

      toast({
        title: "주제가 삭제되었습니다",
        description: "주제가 성공적으로 삭제되었습니다",
      })
    } catch (error) {
      toast({
        title: "주제 삭제 실패",
        description: "주제를 삭제하는 중 오류가 발생했습니다",
        variant: "destructive",
      })
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

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
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
                게임에 사용할 새로운 주제를 추가하세요
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">주제 제목</Label>
                <Input
                  id="title"
                  placeholder="예: 동물, 음식, 영화 등"
                  value={newTopic.title}
                  onChange={(e) => setNewTopic(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="description">설명 (선택사항)</Label>
                <Textarea
                  id="description"
                  placeholder="주제에 대한 간단한 설명"
                  value={newTopic.description}
                  onChange={(e) => setNewTopic(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="category">카테고리</Label>
                <Input
                  id="category"
                  placeholder="일반"
                  value={newTopic.category}
                  onChange={(e) => setNewTopic(prev => ({ ...prev, category: e.target.value }))}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  취소
                </Button>
                <Button onClick={handleCreateTopic}>
                  추가
                </Button>
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
                <Badge variant="secondary">{topic.category}</Badge>
                <span className="text-sm text-muted-foreground">
                  답안 {topic.answerCount}개
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
              <Button onClick={() => setIsCreateDialogOpen(true)}>
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
