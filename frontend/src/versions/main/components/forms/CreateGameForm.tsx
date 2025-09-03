import * as React from "react"
import {motion} from "framer-motion"
import {useForm} from "react-hook-form"
import {zodResolver} from "@hookform/resolvers/zod"
import {Card, CardContent, CardHeader, CardTitle} from "../ui/card"
import {Button} from "../ui/button"
import {type CreateGameFormData, createGameSchema} from "../../lib/validations"
import {buttonInteraction, cardAppear} from "../../lib/animations"
import {cn} from "../../lib/utils"
import {RadioGroupItem} from "../ui/radio-group"
import {Shield, Target} from "lucide-react"

interface CreateGameFormProps {
  onSubmit: (data: CreateGameFormData) => Promise<void>
  className?: string
}

export const CreateGameForm: React.FC<CreateGameFormProps> = ({
  onSubmit,
  className
}) => {
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm<CreateGameFormData>({
    resolver: zodResolver(createGameSchema),
    defaultValues: {
      gameParticipants: 6,
      gameLiarCount: 1,
      gameTotalRounds: 3,
      gameMode: 'LIARS_KNOW',
      targetPoints: 10,
      useRandomSubjects: true,
      randomSubjectCount: 2
    }
  })

  const gameMode = watch('gameMode')
  const gameParticipants = watch('gameParticipants')
  const useRandomSubjects = watch('useRandomSubjects')

  const handleFormSubmit = async (data: CreateGameFormData) => {
    setIsSubmitting(true)
    try {
      await onSubmit(data)
    } catch (error) {
      console.error('게임 생성 실패:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <motion.div
      initial="initial"
      animate="animate"
      variants={cardAppear}
      className={className}
    >
      <Card>
        <CardHeader>
          <CardTitle>게임방 생성</CardTitle>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
            {/* 기본 설정 */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">기본 설정</h3>

              {/* 참여자 수 */}
              <div className="space-y-2">
                <label className="text-sm font-medium">참여자 수</label>
                <div className="flex gap-2">
                  {[4, 5, 6, 7, 8, 9, 10].map((num) => (
                    <Button
                      key={num}
                      type="button"
                      variant={gameParticipants === num ? "default" : "outline"}
                      size="sm"
                      onClick={() => setValue('gameParticipants', num)}
                    >
                      {num}명
                    </Button>
                  ))}
                </div>
                {errors.gameParticipants && (
                  <p className="text-sm text-destructive">{errors.gameParticipants.message}</p>
                )}
              </div>

              {/* 라이어 수 */}
              <div className="space-y-2">
                <label className="text-sm font-medium">라이어 수</label>
                <div className="flex gap-2">
                  {[1, 2, 3].map((num) => (
                    <Button
                      key={num}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setValue('gameLiarCount', num)}
                    >
                      {num}명
                    </Button>
                  ))}
                </div>
                {errors.gameLiarCount && (
                  <p className="text-sm text-destructive">{errors.gameLiarCount.message}</p>
                )}
              </div>

              {/* 라운드 수 */}
              <div className="space-y-2">
                <label className="text-sm font-medium">라운드 수</label>
                <div className="flex gap-2">
                  {[1, 3, 5, 7, 10].map((num) => (
                    <Button
                      key={num}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setValue('gameTotalRounds', num)}
                    >
                      {num}라운드
                    </Button>
                  ))}
                </div>
                {errors.gameTotalRounds && (
                  <p className="text-sm text-destructive">{errors.gameTotalRounds.message}</p>
                )}
              </div>

              {/* 목표 점수 */}
              <div className="space-y-2">
                <label className="text-sm font-medium">목표 점수</label>
                <div className="flex gap-2">
                  {[5, 10, 15, 20, 30, 50].map((num) => (
                    <Button
                      key={num}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setValue('targetPoints', num)}
                    >
                      {num}점
                    </Button>
                  ))}
                </div>
                {errors.targetPoints && (
                  <p className="text-sm text-destructive">{errors.targetPoints.message}</p>
                )}
              </div>
            </div>

            {/* 게임 모드 */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">게임 모드</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <motion.div {...buttonInteraction}>
                  <Card
                    className={cn(
                      "cursor-pointer transition-all",
                      gameMode === 'LIARS_KNOW'
                        ? "ring-2 ring-primary bg-primary/5"
                        : "hover:bg-muted/50"
                    )}
                    onClick={() => setValue('gameMode', 'LIARS_KNOW')}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <RadioGroupItem value="LIARS_KNOW" />
                        <Shield className="h-4 w-4" />
                        <span className="font-medium">라이어가 아는 모드</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        라이어가 자신의 역할을 알고 시작합니다
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>

                <motion.div {...buttonInteraction}>
                  <Card
                    className={cn(
                      "cursor-pointer transition-all",
                      gameMode === 'LIARS_DIFFERENT_WORD'
                        ? "ring-2 ring-primary bg-primary/5"
                        : "hover:bg-muted/50"
                    )}
                    onClick={() => setValue('gameMode', 'LIARS_DIFFERENT_WORD')}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <RadioGroupItem value="LIARS_DIFFERENT_WORD" />
                        <Target className="h-4 w-4" />
                        <span className="font-medium">라이어 다른 단어 모드</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        라이어가 다른 주제의 단어를 받습니다
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              </div>
              {errors.gameMode && (
                <p className="text-sm text-destructive">{errors.gameMode.message}</p>
              )}
            </div>

            {/* 주제 설정 */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">주제 설정</h3>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  {...register('useRandomSubjects')}
                  id="useRandomSubjects"
                  className="rounded"
                />
                <label htmlFor="useRandomSubjects" className="text-sm">
                  랜덤 주제 사용
                </label>
              </div>

              {useRandomSubjects && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">랜덤 주제 개수</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((num) => (
                      <Button
                        key={num}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setValue('randomSubjectCount', num)}
                      >
                        {num}개
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 제출 버튼 */}
            <motion.div {...buttonInteraction}>
              <Button
                type="submit"
                variant="game-primary"
                size="lg"
                disabled={isSubmitting}
                className="w-full"
              >
                {isSubmitting ? "게임방 생성 중..." : "게임방 생성"}
              </Button>
            </motion.div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  )
}
