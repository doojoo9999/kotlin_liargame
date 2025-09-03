import * as React from "react"
import {useForm} from "react-hook-form"
import {zodResolver} from "@hookform/resolvers/zod"
import {motion} from "framer-motion"
import {Gamepad2, Plus, Target, Users} from "lucide-react"
import {Card, CardContent, CardHeader, CardTitle} from "../ui/card"
import {Button} from "../ui/button"
import {Input} from "../ui/input"
import {Label} from "../ui/label"
import {RadioGroup, RadioGroupItem} from "../ui/radio-group"
import {Checkbox} from "../ui/checkbox"
import {CreateGameFormData, createGameSchema} from "@/versions/main/lib/validations"

interface CreateGameFormProps {
  onSubmit: (data: CreateGameFormData) => Promise<void>
  disabled?: boolean
  className?: string
}

const formVariants = {
  initial: { opacity: 0, y: 20 },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      staggerChildren: 0.1
    }
  }
}

const fieldVariants = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0 }
}

export function CreateGameForm({ onSubmit, disabled = false, className }: CreateGameFormProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const form = useForm<CreateGameFormData>({
    resolver: zodResolver(createGameSchema),
    defaultValues: {
      gameParticipants: 6,
      gameLiarCount: 1,
      gameTotalRounds: 3,
      gameMode: 'LIARS_KNOW',
      targetPoints: 10,
      useRandomSubjects: true,
      randomSubjectCount: 3
    }
  })

  const watchedValues = form.watch()
  const errors = form.formState.errors

  const handleSubmit = async (data: CreateGameFormData) => {
    if (isSubmitting || disabled) return

    try {
      setIsSubmitting(true)
      await onSubmit(data)
    } catch (error) {
      console.error('게임 생성 실패:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <motion.div
      variants={formVariants}
      initial="initial"
      animate="animate"
      className={className}
    >
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Plus className="h-6 w-6" />
            <span>새 게임 만들기</span>
          </CardTitle>
        </CardHeader>

        <CardContent>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* 기본 설정 */}
            <motion.div variants={fieldVariants} className="space-y-4">
              <div className="flex items-center space-x-2 mb-3">
                <Users className="h-5 w-5 text-blue-500" />
                <h3 className="text-lg font-semibold">기본 설정</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="gameParticipants">참가자 수</Label>
                  <Input
                    id="gameParticipants"
                    type="number"
                    min={4}
                    max={10}
                    {...form.register("gameParticipants", { valueAsNumber: true })}
                    disabled={disabled || isSubmitting}
                  />
                  {errors.gameParticipants && (
                    <p className="text-sm text-red-500">{errors.gameParticipants.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gameLiarCount">라이어 수</Label>
                  <Input
                    id="gameLiarCount"
                    type="number"
                    min={1}
                    max={3}
                    {...form.register("gameLiarCount", { valueAsNumber: true })}
                    disabled={disabled || isSubmitting}
                  />
                  {errors.gameLiarCount && (
                    <p className="text-sm text-red-500">{errors.gameLiarCount.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gameTotalRounds">총 라운드</Label>
                  <Input
                    id="gameTotalRounds"
                    type="number"
                    min={1}
                    max={10}
                    {...form.register("gameTotalRounds", { valueAsNumber: true })}
                    disabled={disabled || isSubmitting}
                  />
                  {errors.gameTotalRounds && (
                    <p className="text-sm text-red-500">{errors.gameTotalRounds.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="targetPoints">목표 점수</Label>
                  <Input
                    id="targetPoints"
                    type="number"
                    min={1}
                    max={50}
                    {...form.register("targetPoints", { valueAsNumber: true })}
                    disabled={disabled || isSubmitting}
                  />
                  {errors.targetPoints && (
                    <p className="text-sm text-red-500">{errors.targetPoints.message}</p>
                  )}
                </div>
              </div>
            </motion.div>

            {/* 게임 모드 */}
            <motion.div variants={fieldVariants} className="space-y-4">
              <div className="flex items-center space-x-2 mb-3">
                <Gamepad2 className="h-5 w-5 text-purple-500" />
                <h3 className="text-lg font-semibold">게임 모드</h3>
              </div>

              <RadioGroup
                value={watchedValues.gameMode}
                onValueChange={(value) => form.setValue("gameMode", value as any)}
                className="space-y-3"
                disabled={disabled || isSubmitting}
              >
                <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50">
                  <RadioGroupItem value="LIARS_KNOW" id="liars-know" />
                  <Label htmlFor="liars-know" className="flex-1 cursor-pointer">
                    <div>
                      <div className="font-medium">라이어가 아는 모드</div>
                      <div className="text-sm text-muted-foreground">
                        라이어가 자신의 역할을 알고 시작합니다
                      </div>
                    </div>
                  </Label>
                </div>

                <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50">
                  <RadioGroupItem value="LIARS_DIFFERENT_WORD" id="liars-different" />
                  <Label htmlFor="liars-different" className="flex-1 cursor-pointer">
                    <div>
                      <div className="font-medium">라이어 다른 단어 모드</div>
                      <div className="text-sm text-muted-foreground">
                        라이어가 다른 주제의 단어를 받습니다
                      </div>
                    </div>
                  </Label>
                </div>
              </RadioGroup>
              {errors.gameMode && (
                <p className="text-sm text-red-500">{errors.gameMode.message}</p>
              )}
            </motion.div>

            {/* 주제 설정 */}
            <motion.div variants={fieldVariants} className="space-y-4">
              <div className="flex items-center space-x-2 mb-3">
                <Target className="h-5 w-5 text-green-500" />
                <h3 className="text-lg font-semibold">주제 설정</h3>
              </div>

              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="useRandomSubjects"
                    checked={watchedValues.useRandomSubjects}
                    onCheckedChange={(checked) => form.setValue("useRandomSubjects", checked as boolean)}
                    disabled={disabled || isSubmitting}
                  />
                  <Label htmlFor="useRandomSubjects" className="cursor-pointer">
                    랜덤 주제 사용
                  </Label>
                </div>

                {watchedValues.useRandomSubjects && (
                  <div className="ml-6 space-y-2">
                    <Label htmlFor="randomSubjectCount">랜덤 주제 개수</Label>
                    <Input
                      id="randomSubjectCount"
                      type="number"
                      min={1}
                      max={10}
                      {...form.register("randomSubjectCount", { valueAsNumber: true })}
                      disabled={disabled || isSubmitting}
                      className="w-32"
                    />
                  </div>
                )}
              </div>
            </motion.div>

            {/* 설정 요약 */}
            <motion.div
              variants={fieldVariants}
              className="bg-blue-50 border border-blue-200 p-4 rounded-lg"
            >
              <h4 className="font-semibold mb-2">설정 요약</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>참가자: {watchedValues.gameParticipants}명</div>
                <div>라이어: {watchedValues.gameLiarCount}명</div>
                <div>라운드: {watchedValues.gameTotalRounds}라운드</div>
                <div>목표점수: {watchedValues.targetPoints}점</div>
                <div className="col-span-2">
                  모드: {watchedValues.gameMode === 'LIARS_KNOW' ? '라이어 인지' : '다른 단어'}
                </div>
              </div>
            </motion.div>

            {/* 제출 버튼 */}
            <motion.div variants={fieldVariants}>
              <Button
                type="submit"
                className="w-full"
                variant="game-primary"
                size="lg"
                disabled={disabled || isSubmitting}
                loading={isSubmitting}
              >
                {isSubmitting ? "게임 생성 중..." : "게임 시작하기"}
              </Button>
            </motion.div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  )
}
