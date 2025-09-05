import * as React from "react"
import {motion} from "framer-motion"
import {Clock, Gamepad2, Target, Users} from "lucide-react"
import {useForm} from "react-hook-form"
import {zodResolver} from "@hookform/resolvers/zod"
import {z} from "zod"
import {Card, CardContent, CardHeader, CardTitle} from "@/versions/main/components/ui/card"
import {Button} from "@/versions/main/components/ui/button"
import {Input} from "@/versions/main/components/ui/input"
import {Label} from "@/versions/main/components/ui/label"
import {Badge} from "@/versions/main/components/ui/badge"
import {Separator} from "@/versions/main/components/ui/separator"
import {RadioGroup, RadioGroupItem} from "@/versions/main/components/ui/radio-group"
import {Checkbox} from "@/versions/main/components/ui/checkbox"
import {fadeInUp} from "@/versions/main/animations"
import {useNotification} from "@/versions/main/providers/NotificationProvider"
import type {GameCreateRequest} from "@/shared/types/api.types"

const gameCreateSchema = z.object({
  gameTitle: z.string().min(1, "게임 제목을 입력하세요").max(50, "제목이 너무 깁니다"),
  gameParticipants: z.number().min(4, "최소 4명").max(10, "최대 10명"),
  gameLiarCount: z.number().min(1, "라이어는 최소 1명"),
  gameTotalRounds: z.number().min(1, "최소 1라운드").max(10, "최대 10라운드"),
  gameMode: z.enum(["LIARS_KNOW", "LIARS_DIFFERENT_WORD"]),
  targetPoints: z.number().min(1, "최소 1점").max(50, "최대 50점"),
  useRandomSubjects: z.boolean(),
  randomSubjectCount: z.number().min(1).max(20).optional(),
  subjectIds: z.array(z.number()).optional(),
  isPrivate: z.boolean(),
  password: z.string().optional()
})

type GameCreateForm = z.infer<typeof gameCreateSchema>

interface GameCreateFormProps {
  onSubmit: (data: GameCreateRequest) => void
  onCancel: () => void
  isLoading?: boolean
}

export function GameCreateForm({ onSubmit, onCancel, isLoading }: GameCreateFormProps) {
  const { addNotification } = useNotification()

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid }
  } = useForm<GameCreateForm>({
    resolver: zodResolver(gameCreateSchema),
    defaultValues: {
      gameParticipants: 6,
      gameLiarCount: 1,
      gameTotalRounds: 3,
      gameMode: "LIARS_KNOW",
      targetPoints: 10,
      useRandomSubjects: true,
      randomSubjectCount: 5,
      isPrivate: false
    }
  })

  const gameParticipants = watch("gameParticipants")
  const gameLiarCount = watch("gameLiarCount")
  const useRandomSubjects = watch("useRandomSubjects")
  const isPrivate = watch("isPrivate")

  // 라이어 수는 전체 참여자의 절반을 넘을 수 없음
  React.useEffect(() => {
    const maxLiars = Math.floor(gameParticipants / 2)
    if (gameLiarCount > maxLiars) {
      setValue("gameLiarCount", maxLiars)
    }
  }, [gameParticipants, gameLiarCount, setValue])

  const handleFormSubmit = (data: GameCreateForm) => {
    try {
      const request: GameCreateRequest = {
        gameParticipants: data.gameParticipants,
        gameLiarCount: data.gameLiarCount,
        gameTotalRounds: data.gameTotalRounds,
        gameMode: data.gameMode,
        targetPoints: data.targetPoints,
        useRandomSubjects: data.useRandomSubjects,
        randomSubjectCount: data.useRandomSubjects ? (data.randomSubjectCount || 5) : 0,
        subjectIds: data.useRandomSubjects ? [] : (data.subjectIds || [])
      }

      onSubmit(request)
    } catch (error) {
      addNotification({
        type: 'error',
        title: '게임 생성 실패',
        message: '게임 설정을 확인해주세요'
      })
    }
  }

  const gameModeOptions = [
    {
      value: "LIARS_KNOW" as const,
      label: "라이어 서로 알기",
      description: "라이어들이 서로를 알 수 있습니다"
    },
    {
      value: "LIARS_DIFFERENT_WORD" as const,
      label: "라이어 다른 단어",
      description: "라이어는 다른 단어를 받습니다"
    }
  ]

  return (
    <motion.div
      variants={fadeInUp}
      initial="initial"
      animate="animate"
      className="space-y-6"
    >
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        {/* 기본 설정 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Gamepad2 className="w-5 h-5" />
              기본 설정
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="gameTitle">게임 제목</Label>
              <Input
                id="gameTitle"
                placeholder="재미있는 라이어 게임"
                {...register("gameTitle")}
              />
              {errors.gameTitle && (
                <p className="text-sm text-red-600">{errors.gameTitle.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="gameParticipants">참여자 수</Label>
                <Input
                  id="gameParticipants"
                  type="number"
                  min={4}
                  max={10}
                  {...register("gameParticipants", { valueAsNumber: true })}
                />
                {errors.gameParticipants && (
                  <p className="text-sm text-red-600">{errors.gameParticipants.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="gameLiarCount">라이어 수</Label>
                <Input
                  id="gameLiarCount"
                  type="number"
                  min={1}
                  max={Math.floor(gameParticipants / 2)}
                  {...register("gameLiarCount", { valueAsNumber: true })}
                />
                {errors.gameLiarCount && (
                  <p className="text-sm text-red-600">{errors.gameLiarCount.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="gameTotalRounds">라운드 수</Label>
                <Input
                  id="gameTotalRounds"
                  type="number"
                  min={1}
                  max={10}
                  {...register("gameTotalRounds", { valueAsNumber: true })}
                />
                {errors.gameTotalRounds && (
                  <p className="text-sm text-red-600">{errors.gameTotalRounds.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="targetPoints">목표 점수</Label>
                <Input
                  id="targetPoints"
                  type="number"
                  min={1}
                  max={50}
                  {...register("targetPoints", { valueAsNumber: true })}
                />
                {errors.targetPoints && (
                  <p className="text-sm text-red-600">{errors.targetPoints.message}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 게임 모드 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              게임 모드
            </CardTitle>
          </CardHeader>
          <CardContent>
            <RadioGroup
              value={watch("gameMode")}
              onValueChange={(value) => setValue("gameMode", value as "LIARS_KNOW" | "LIARS_DIFFERENT_WORD")}
              className="space-y-3"
            >
              {gameModeOptions.map((option) => (
                <div key={option.value} className="flex items-start space-x-3 p-3 rounded-lg border">
                  <RadioGroupItem value={option.value} id={option.value} className="mt-1" />
                  <div className="flex-1">
                    <Label htmlFor={option.value} className="text-sm font-medium cursor-pointer">
                      {option.label}
                    </Label>
                    <p className="text-xs text-muted-foreground mt-1">
                      {option.description}
                    </p>
                  </div>
                </div>
              ))}
            </RadioGroup>
          </CardContent>
        </Card>

        {/* 주제 설정 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              주제 설정
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="useRandomSubjects"
                checked={useRandomSubjects}
                onCheckedChange={(checked) => setValue("useRandomSubjects", !!checked)}
              />
              <Label htmlFor="useRandomSubjects" className="cursor-pointer">
                랜덤 주제 사용
              </Label>
            </div>

            {useRandomSubjects && (
              <div className="space-y-2">
                <Label htmlFor="randomSubjectCount">랜덤 주제 개수</Label>
                <Input
                  id="randomSubjectCount"
                  type="number"
                  min={1}
                  max={20}
                  placeholder="5"
                  {...register("randomSubjectCount", { valueAsNumber: true })}
                />
              </div>
            )}

            {!useRandomSubjects && (
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">
                  개별 주제 선택 기능은 곧 추가될 예정입니다.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 방 설정 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              방 설정
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isPrivate"
                checked={isPrivate}
                onCheckedChange={(checked) => setValue("isPrivate", !!checked)}
              />
              <Label htmlFor="isPrivate" className="cursor-pointer">
                비공개 방
              </Label>
            </div>

            {isPrivate && (
              <div className="space-y-2">
                <Label htmlFor="password">방 비밀번호</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="비밀번호를 입력하세요"
                  {...register("password")}
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* 게임 미리보기 */}
        <Card className="bg-muted/50">
          <CardHeader>
            <CardTitle className="text-lg">게임 미리보기</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>참여자:</span>
                  <Badge variant="secondary">{gameParticipants}명</Badge>
                </div>
                <div className="flex justify-between">
                  <span>라이어:</span>
                  <Badge variant="destructive">{gameLiarCount}명</Badge>
                </div>
                <div className="flex justify-between">
                  <span>시민:</span>
                  <Badge variant="default">{gameParticipants - gameLiarCount}명</Badge>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>라운드:</span>
                  <span>{watch("gameTotalRounds")}라운드</span>
                </div>
                <div className="flex justify-between">
                  <span>목표점수:</span>
                  <span>{watch("targetPoints")}점</span>
                </div>
                <div className="flex justify-between">
                  <span>모드:</span>
                  <span className="text-xs">
                    {watch("gameMode") === "LIARS_KNOW" ? "라이어 서로 알기" : "라이어 다른 단어"}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Separator />

        {/* 액션 버튼 */}
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="flex-1"
            disabled={isLoading}
          >
            취소
          </Button>
          <Button
            type="submit"
            variant="game-primary"
            className="flex-1"
            disabled={!isValid || isLoading}
          >
            {isLoading ? "생성 중..." : "게임 만들기"}
          </Button>
        </div>
      </form>
    </motion.div>
  )
}
