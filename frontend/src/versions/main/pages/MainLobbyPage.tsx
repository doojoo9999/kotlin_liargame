import * as React from "react"
import {motion} from "framer-motion"
import {Button} from "@/versions/main/components/ui/button"
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/versions/main/components/ui/card"
import {Badge} from "@/versions/main/components/ui/badge"
import {Input} from "@/versions/main/components/ui/input"
import {Crown, MessageSquare, Play, Settings, Users} from "lucide-react"

interface LobbyRoom {
  id: string
  name: string
  host: string
  currentPlayers: number
  maxPlayers: number
  gameMode: string
  status: 'waiting' | 'playing'
}

const mockRooms: LobbyRoom[] = [
  {
    id: "1",
    name: "초보자 방",
    host: "플레이어1",
    currentPlayers: 3,
    maxPlayers: 8,
    gameMode: "LIARS_KNOW",
    status: "waiting"
  },
  {
    id: "2",
    name: "고수방",
    host: "마스터",
    currentPlayers: 6,
    maxPlayers: 10,
    gameMode: "LIARS_DIFFERENT_WORD",
    status: "playing"
  }
]

export default function MainLobbyPage() {
  const [searchTerm, setSearchTerm] = React.useState("")
  const [showCreateRoom, setShowCreateRoom] = React.useState(false)

  const filteredRooms = mockRooms.filter(room =>
    room.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-gray-800 mb-2">라이어 게임 로비</h1>
          <p className="text-gray-600">친구들과 함께 즐기는 추리 게임</p>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8"
        >
          <Card>
            <CardContent className="p-6 text-center">
              <Users className="w-8 h-8 mx-auto mb-2 text-blue-600" />
              <div className="text-2xl font-bold text-gray-800">1,234</div>
              <div className="text-sm text-gray-600">온라인 플레이어</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <Play className="w-8 h-8 mx-auto mb-2 text-green-600" />
              <div className="text-2xl font-bold text-gray-800">56</div>
              <div className="text-sm text-gray-600">진행 중인 게임</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 text-purple-600" />
              <div className="text-2xl font-bold text-gray-800">89</div>
              <div className="text-sm text-gray-600">대기 중인 방</div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Controls */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col sm:flex-row gap-4 mb-6"
        >
          <Input
            placeholder="방 이름으로 검색..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1"
          />
          <Button
            variant="game-primary"
            onClick={() => setShowCreateRoom(true)}
            className="px-6"
          >
            <Settings className="w-4 h-4 mr-2" />
            방 만들기
          </Button>
        </motion.div>

        {/* Room List */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {filteredRooms.map((room, index) => (
            <motion.div
              key={room.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * index }}
            >
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{room.name}</CardTitle>
                    <Badge
                      variant={room.status === 'waiting' ? 'game-success' : 'game-warning'}
                    >
                      {room.status === 'waiting' ? '대기중' : '게임중'}
                    </Badge>
                  </div>
                  <CardDescription className="flex items-center gap-2">
                    <Crown className="w-4 h-4" />
                    {room.host}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">플레이어</span>
                      <span className="font-semibold">
                        {room.currentPlayers}/{room.maxPlayers}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">게임 모드</span>
                      <Badge variant="outline">
                        {room.gameMode === 'LIARS_KNOW' ? '라이어가 아는' : '라이어가 모르는'}
                      </Badge>
                    </div>
                    <Button
                      className="w-full"
                      variant={room.status === 'waiting' ? 'game-primary' : 'secondary'}
                      disabled={room.status === 'playing'}
                    >
                      {room.status === 'waiting' ? '참가하기' : '관전하기'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {filteredRooms.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <div className="text-gray-500 mb-4">검색 결과가 없습니다</div>
            <Button variant="game-primary" onClick={() => setShowCreateRoom(true)}>
              새 방 만들기
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  )
}
