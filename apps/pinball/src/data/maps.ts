import type {MapDefinition, MapObstacle} from '../types'

const createNeonMegapolisObstacles = (): MapObstacle[] => {
    const obstacles: MapObstacle[] = []

    // 상단 깔때기 - 공을 중앙으로 유도
    obstacles.push(
        {
            type: 'wall',
            x: 500,
            y: 300,
            width: 700,
            height: 28,
            angle: -0.6, // 안쪽으로 기울임
            restitution: 1.0,
        },
        {
            type: 'wall',
            x: 2100,
            y: 300,
            width: 700,
            height: 28,
            angle: 0.6, // 안쪽으로 기울임
            restitution: 1.0,
        }
    )

    // 측면 벽 - 공이 빠져나가지 못하도록 하되, 갇히지 않도록 설계
    obstacles.push(
        {
            type: 'wall',
            x: 150,
            y: 1200,
            width: 36,
            height: 1800,
            angle: 0.08, // 약간 안쪽으로 기울임
            restitution: 0.9,
        },
        {
            type: 'wall',
            x: 2450,
            y: 1200,
            width: 36,
            height: 1800,
            angle: -0.08, // 약간 안쪽으로 기울임
            restitution: 0.9,
        }
    )

    // 상단 페그 구역 - 공이 통과할 수 있는 간격 확보
    for (let row = 0; row < 5; row += 1) {
        for (let col = 0; col < 8; col += 1) {
            const radius = 26
            const restitution = row % 2 === 0 ? 0.92 : 1.0
            const x = 350 + col * 250 + (row % 2 === 0 ? 0 : 125)
            const y = 700 + row * 200
            obstacles.push({
                type: 'peg',
                x,
                y,
                radius,
                restitution,
            })
        }
    }

    // 중앙 범퍼 링 - 타원형으로 배치하여 공이 빠져나갈 수 있도록
    const ringCenter = {x: 1300, y: 1850}
    const ringRadiusX = 420
    const ringRadiusY = 260
    for (let i = 0; i < 8; i += 1) {
        const angle = (i / 8) * Math.PI * 2
        obstacles.push({
            type: 'bumper',
            x: ringCenter.x + Math.cos(angle) * ringRadiusX,
            y: ringCenter.y + Math.sin(angle) * ringRadiusY,
            radius: 48,
            restitution: 1.4,
            impulseScale: 0.04,
        })
    }

    // 중앙 가이드 벽 - 공을 좌우로 분산
    obstacles.push(
        {
            type: 'wall',
            x: 700,
            y: 2250,
            width: 520,
            height: 26,
            angle: -0.45,
            restitution: 1.02,
        },
        {
            type: 'wall',
            x: 1900,
            y: 2250,
            width: 520,
            height: 26,
            angle: 0.45,
            restitution: 1.02,
        }
    )

    // 지그재그 구역 - 공이 막히지 않도록 간격 조정
    const zigSegments = [
        {x: 950, y: 2650, angle: -0.35, width: 450},
        {x: 1650, y: 2850, angle: 0.35, width: 450},
        {x: 950, y: 3050, angle: -0.35, width: 450},
        {x: 1650, y: 3250, angle: 0.35, width: 450},
    ]
    zigSegments.forEach((segment) => {
        obstacles.push({
            type: 'wall',
            x: segment.x,
            y: segment.y,
            width: segment.width,
            height: 24,
            angle: segment.angle,
            restitution: 1.05,
        })
    })

    // 하단 페그 구역 - 간격을 넓혀서 공이 통과 가능하도록
    for (let row = 0; row < 2; row += 1) {
        for (let col = 0; col < 7; col += 1) {
            const x = 400 + col * 280 + (row % 2 === 0 ? 0 : 140)
            const y = 3350 + row * 200
            obstacles.push({
                type: 'peg',
                x,
                y,
                radius: 26,
                restitution: 0.96,
            })
        }
    }

    // 하단 깔때기 - 공을 중앙 배출구로 유도
    obstacles.push(
        {
            type: 'wall',
            x: 650,
            y: 3650,
            width: 600,
            height: 26,
            angle: -0.5,
            restitution: 1.08,
        },
        {
            type: 'wall',
            x: 1950,
            y: 3650,
            width: 600,
            height: 26,
            angle: 0.5,
            restitution: 1.08,
        }
    )

    // 최종 가이드 - 배출구로 유도
    obstacles.push(
        {
            type: 'wall',
            x: 500,
            y: 3900,
            width: 380,
            height: 24,
            angle: -0.4,
            restitution: 1.05,
        },
        {
            type: 'wall',
            x: 2100,
            y: 3900,
            width: 380,
            height: 24,
            angle: 0.4,
            restitution: 1.05,
        }
    )

    return obstacles
}

const createCascadeCitadelObstacles = (): MapObstacle[] => {
    const obstacles: MapObstacle[] = []

    // 상단 깔때기
    obstacles.push(
        {
            type: 'wall',
            x: 520,
            y: 320,
            width: 750,
            height: 28,
            angle: -0.65,
            restitution: 1.02,
        },
        {
            type: 'wall',
            x: 1960,
            y: 320,
            width: 750,
            height: 28,
            angle: 0.65,
            restitution: 1.02,
        }
    )

    // 측면 벽 - 약간 안쪽으로
    obstacles.push(
        {
            type: 'wall',
            x: 200,
            y: 1200,
            width: 38,
            height: 2000,
            angle: 0.06,
            restitution: 0.92,
        },
        {
            type: 'wall',
            x: 2280,
            y: 1200,
            width: 38,
            height: 2000,
            angle: -0.06,
            restitution: 0.92,
        }
    )

    // 계단식 경사로 - 공이 지그재그로 내려올 수 있도록
    const terraces = [
        {x: 600, y: 950, angle: -0.38, width: 480},
        {x: 1880, y: 1150, angle: 0.38, width: 480},
        {x: 600, y: 1450, angle: -0.38, width: 480},
        {x: 1880, y: 1650, angle: 0.38, width: 480},
        {x: 600, y: 1950, angle: -0.38, width: 480},
        {x: 1880, y: 2150, angle: 0.38, width: 480},
    ]
    terraces.forEach((terrace) => {
        obstacles.push({
            type: 'wall',
            x: terrace.x,
            y: terrace.y,
            width: terrace.width,
            height: 24,
            angle: terrace.angle,
            restitution: 1.03,
        })
    })

    // 페그 배치 - 간격을 조정하여 막히지 않도록
    for (let row = 0; row < 5; row += 1) {
        for (let col = 0; col < 7; col += 1) {
            const x = 400 + col * 280 + (row % 2 === 0 ? 0 : 140)
            const y = 1000 + row * 440
            const radius = 28
            const restitution = row % 2 === 0 ? 0.94 : 1.04
            obstacles.push({
                type: 'peg',
                x,
                y,
                radius,
                restitution,
            })
        }
    }

    // 중앙 범퍼 라인 - 공이 양옆으로 빠져나갈 수 있도록
    const bumperSpine = [1300, 1750, 2200, 2650]
    bumperSpine.forEach((y) => {
        obstacles.push({
            type: 'bumper',
            x: 1240,
            y,
            radius: 42,
            restitution: 1.5,
            impulseScale: 0.045,
        })
    })

    // 하단 범퍼 원 - 중앙에서 빠져나갈 공간 확보
    for (let i = 0; i < 6; i += 1) {
        if (i === 3) continue // 아래쪽 구멍 확보
        const angle = (i / 6) * Math.PI * 2 - Math.PI / 2
        obstacles.push({
            type: 'bumper',
            x: 1240 + Math.cos(angle) * 300,
            y: 3100 + Math.sin(angle) * 200,
            radius: 38,
            restitution: 1.45,
            impulseScale: 0.04,
        })
    }

    // 하단 깔때기
    obstacles.push(
        {
            type: 'wall',
            x: 620,
            y: 3600,
            width: 600,
            height: 26,
            angle: -0.55,
            restitution: 1.1,
        },
        {
            type: 'wall',
            x: 1860,
            y: 3600,
            width: 600,
            height: 26,
            angle: 0.55,
            restitution: 1.1,
        }
    )

    // 최종 가이드
    obstacles.push(
        {
            type: 'wall',
            x: 480,
            y: 3880,
            width: 400,
            height: 24,
            angle: -0.45,
            restitution: 1.06,
        },
        {
            type: 'wall',
            x: 2000,
            y: 3880,
            width: 400,
            height: 24,
            angle: 0.45,
            restitution: 1.06,
        }
    )

    // 하단 페그 - 최소화
    for (let col = 0; col < 5; col += 1) {
        obstacles.push({
            type: 'peg',
            x: 520 + col * 360,
            y: 3750 + (col % 2 === 0 ? 80 : 0),
            radius: 24,
            restitution: 1.04,
        })
    }

    return obstacles
}

const createQuantumWildsObstacles = (): MapObstacle[] => {
    const obstacles: MapObstacle[] = []

    // 측면 벽
    obstacles.push(
        {
            type: 'wall',
            x: 180,
            y: 1300,
            width: 40,
            height: 2200,
            angle: 0.05,
            restitution: 0.94,
        },
        {
            type: 'wall',
            x: 2340,
            y: 1300,
            width: 40,
            height: 2200,
            angle: -0.05,
            restitution: 0.94,
        }
    )

    // 상단 입구
    obstacles.push(
        {
            type: 'wall',
            x: 700,
            y: 480,
            width: 680,
            height: 24,
            angle: -0.75,
            restitution: 1.06,
        },
        {
            type: 'wall',
            x: 1820,
            y: 480,
            width: 680,
            height: 24,
            angle: 0.75,
            restitution: 1.06,
        },
        {
            type: 'wall',
            x: 1260,
            y: 740,
            width: 860,
            height: 24,
            restitution: 0.98,
        }
    )

    // 상단 페그 구역
    for (let row = 0; row < 4; row += 1) {
        for (let col = 0; col < 8; col += 1) {
            const x = 350 + col * 260 + (row % 2 === 0 ? 0 : 130)
            const y = 1050 + row * 280
            const radius = 26
            const restitution = row % 2 === 0 ? 1.02 : 1.08
            obstacles.push({
                type: 'peg',
                x,
                y,
                radius,
                restitution,
            })
        }
    }

    // 외부 범퍼 링 - 빠져나갈 공간 확보
    const vortexCenter = {x: 1260, y: 1900}
    const outerRadiusX = 480
    const outerRadiusY = 300
    for (let i = 0; i < 10; i += 1) {
        if (i === 5) continue // 아래쪽 출구
        const angle = (i / 10) * Math.PI * 2
        obstacles.push({
            type: 'bumper',
            x: vortexCenter.x + Math.cos(angle) * outerRadiusX,
            y: vortexCenter.y + Math.sin(angle) * outerRadiusY,
            radius: 40,
            restitution: 1.6,
            impulseScale: 0.048,
        })
    }

    // 내부 범퍼 링 - 더 작게
    const innerRadiusX = 240
    const innerRadiusY = 160
    for (let i = 0; i < 6; i += 1) {
        const angle = (i / 6) * Math.PI * 2 + Math.PI / 6
        obstacles.push({
            type: 'bumper',
            x: vortexCenter.x + Math.cos(angle) * innerRadiusX,
            y: vortexCenter.y + Math.sin(angle) * innerRadiusY,
            radius: 34,
            restitution: 1.55,
            impulseScale: 0.042,
        })
    }

    // 경사로 구역 - 간격 조정
    const rampBands = [
        {x: 580, y: 2450, angle: -0.36, width: 500},
        {x: 1940, y: 2450, angle: 0.36, width: 500},
        {x: 750, y: 2700, angle: -0.4, width: 480},
        {x: 1770, y: 2700, angle: 0.4, width: 480},
    ]
    rampBands.forEach((band, index) => {
        obstacles.push({
            type: 'wall',
            x: band.x,
            y: band.y,
            width: band.width,
            height: 26,
            angle: band.angle,
            restitution: index % 2 === 0 ? 1.06 : 1.1,
        })
    })

    // 중하단 페그
    for (let row = 0; row < 3; row += 1) {
        for (let col = 0; col < 6; col += 1) {
            const x = 480 + col * 320 + (row % 2 === 0 ? 0 : 160)
            const y = 3000 + row * 220
            obstacles.push({
                type: 'peg',
                x,
                y,
                radius: 28,
                restitution: 1.08,
            })
        }
    }

    // 하단 범퍼 - 배치 조정
    const bottomBumpers = [
        {x: 900, y: 3380},
        {x: 1620, y: 3380},
    ]
    bottomBumpers.forEach((entry) => {
        obstacles.push({
            type: 'bumper',
            x: entry.x,
            y: entry.y,
            radius: 40,
            restitution: 1.58,
            impulseScale: 0.045,
        })
    })

    // 하단 깔때기
    obstacles.push(
        {
            type: 'wall',
            x: 650,
            y: 3650,
            width: 620,
            height: 26,
            angle: -0.55,
            restitution: 1.12,
        },
        {
            type: 'wall',
            x: 1870,
            y: 3650,
            width: 620,
            height: 26,
            angle: 0.55,
            restitution: 1.12,
        }
    )

    // 최종 가이드
    obstacles.push(
        {
            type: 'wall',
            x: 500,
            y: 3920,
            width: 400,
            height: 24,
            angle: -0.48,
            restitution: 1.1,
        },
        {
            type: 'wall',
            x: 2020,
            y: 3920,
            width: 400,
            height: 24,
            angle: 0.48,
            restitution: 1.1,
        }
    )

    // 하단 페그 최소화
    for (let col = 0; col < 5; col += 1) {
        obstacles.push({
            type: 'peg',
            x: 520 + col * 360,
            y: 3820 + (col % 2 === 0 ? 100 : 0),
            radius: 26,
            restitution: 1.1,
        })
    }

    return obstacles
}

export const MAPS: MapDefinition[] = [
    {
        id: 'neon-plaza',
        name: '네온 메가폴리스',
        description:
            '거대한 도시형 레이아웃. 넓은 상단 깔때기와 링 형태의 범퍼가 균형 잡힌 난이도를 제공합니다.',
        difficulty: 'casual',
        background: {
            gradientFrom: '#1e293b',
            gradientTo: '#0f172a',
            accent: '#6366f1',
        },
        size: {
            width: 2600,
            height: 4200,
        },
        gravityScale: 1.06,
        spawnSlots: [0.08, 0.18, 0.28, 0.38, 0.48, 0.58, 0.68, 0.78, 0.88, 0.96],
        drainY: 4100, // drainY를 높여서 공이 배출되기 쉽게
        obstacles: createNeonMegapolisObstacles(),
    },
    {
        id: 'cascade-labyrinth',
        name: '카스케이드 시타델',
        description: '연속적인 폭포형 경사와 중심 스파인이 있는 미궁. 궤적 제어가 핵심입니다.',
        difficulty: 'standard',
        background: {
            gradientFrom: '#0f172a',
            gradientTo: '#1e1b4b',
            accent: '#22d3ee',
        },
        size: {
            width: 2480,
            height: 4300,
        },
        gravityScale: 1.1,
        spawnSlots: [0.08, 0.18, 0.28, 0.38, 0.48, 0.58, 0.68, 0.78, 0.88, 0.96],
        drainY: 4200,
        obstacles: createCascadeCitadelObstacles(),
    },
    {
        id: 'quantum-wilds',
        name: '퀀텀 카오스 와일즈',
        description: '복층 와류와 가속 레일이 어우러진 하드 모드. 폭발적인 튕김을 견뎌야 합니다.',
        difficulty: 'chaos',
        background: {
            gradientFrom: '#111827',
            gradientTo: '#0b1120',
            accent: '#f97316',
        },
        size: {
            width: 2520,
            height: 4400,
        },
        gravityScale: 1.24,
        spawnSlots: [0.07, 0.16, 0.25, 0.34, 0.43, 0.52, 0.61, 0.7, 0.79, 0.88, 0.97],
        drainY: 4280,
        obstacles: createQuantumWildsObstacles(),
    },
]