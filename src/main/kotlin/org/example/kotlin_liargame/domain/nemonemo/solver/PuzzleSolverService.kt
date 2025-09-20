package org.example.kotlin_liargame.domain.nemonemo.solver

import org.springframework.stereotype.Service
import kotlin.math.ln
import kotlin.math.max

@Service
class PuzzleSolverService {

    fun solve(rowHints: List<List<Int>>, columnHints: List<List<Int>>): PuzzleSolverResult {
        require(rowHints.isNotEmpty()) { "Row hints must not be empty" }
        require(columnHints.isNotEmpty()) { "Column hints must not be empty" }
        val height = rowHints.size
        val width = columnHints.size

        val rowPatterns = rowHints.map { hints ->
            generateRowPatterns(width, hints)
        }
        val columnState = ColumnState(columnHints, height)
        val currentGrid = Array(height) { BooleanArray(width) }
        var visitedNodes = 0
        var solutionsFound = 0
        var capturedSolution: Array<BooleanArray>? = null

        fun backtrack(rowIndex: Int) {
            if (solutionsFound >= 2) {
                return
            }
            if (rowIndex == height) {
                if (columnState.isComplete()) {
                    solutionsFound++
                    if (solutionsFound == 1) {
                        capturedSolution = Array(height) { idx -> currentGrid[idx].copyOf() }
                    }
                }
                return
            }

            val patterns = rowPatterns[rowIndex]
            for (pattern in patterns) {
                visitedNodes++
                if (columnState.applyRow(rowIndex, pattern)) {
                    currentGrid[rowIndex] = pattern.copyOf()
                    backtrack(rowIndex + 1)
                    columnState.revert()
                    if (solutionsFound >= 2) {
                        return
                    }
                }
            }
        }

        backtrack(0)

        val uniqueSolution = solutionsFound == 1
        val difficultyScore = if (visitedNodes == 0) 0.0 else ln(visitedNodes.toDouble()) * 100.0

        val solutionPayload = capturedSolution?.map { row ->
            row.map { if (it) 1 else 0 }
        }

        return PuzzleSolverResult(
            uniqueSolution = uniqueSolution,
            solutionsFound = solutionsFound,
            visitedNodes = visitedNodes,
            difficultyScore = difficultyScore,
            solution = solutionPayload
        )
    }

    private fun generateRowPatterns(width: Int, hints: List<Int>): List<BooleanArray> {
        if (hints.isEmpty()) {
            return listOf(BooleanArray(width))
        }
        val totalBlocks = hints.sum()
        require(totalBlocks <= width) { "Row hints exceed row width" }
        val patterns = mutableListOf<BooleanArray>()
        val buffer = BooleanArray(width)

        fun placeHint(hintIndex: Int, startPosition: Int) {
            if (hintIndex == hints.size) {
                for (i in startPosition until width) {
                    buffer[i] = false
                }
                patterns += buffer.copyOf()
                return
            }

            val hintLength = hints[hintIndex]
            val remainingHintsLength = hints.drop(hintIndex + 1).sum()
            val remainingBlocks = hints.size - hintIndex - 1
            val maxStart = width - hintLength - remainingHintsLength - max(0, remainingBlocks)
            var position = startPosition
            while (position <= maxStart) {
                for (i in startPosition until position) {
                    buffer[i] = false
                }
                for (i in position until position + hintLength) {
                    buffer[i] = true
                }
                val nextStart = position + hintLength + 1
                if (hintIndex == hints.lastIndex) {
                    for (i in position + hintLength until width) {
                        buffer[i] = false
                    }
                    patterns += buffer.copyOf()
                } else {
                    buffer[position + hintLength] = false
                    placeHint(hintIndex + 1, nextStart)
                }
                position++
            }
        }

        placeHint(0, 0)
        return patterns
    }

    private class ColumnState(
        columnHints: List<List<Int>>,
        private val height: Int
    ) {
        private val hints: List<IntArray> = columnHints.map { it.toIntArray() }
        private val runIndices = IntArray(hints.size)
        private val currentRuns = IntArray(hints.size)
        private val backupRunIndices = IntArray(hints.size)
        private val backupCurrentRuns = IntArray(hints.size)

        fun applyRow(rowIndex: Int, pattern: BooleanArray): Boolean {
            snapshot()
            for (column in pattern.indices) {
                val filled = pattern[column]
                val hintArray = hints[column]
                if (filled) {
                    if (runIndices[column] >= hintArray.size) {
                        restore()
                        return false
                    }
                    currentRuns[column] = currentRuns[column] + 1
                    if (currentRuns[column] > hintArray[runIndices[column]]) {
                        restore()
                        return false
                    }
                } else {
                    if (currentRuns[column] > 0) {
                        val expected = hintArray[runIndices[column]]
                        if (currentRuns[column] != expected) {
                            restore()
                            return false
                        }
                        runIndices[column] = runIndices[column] + 1
                        currentRuns[column] = 0
                    }
                }
            }

            if (!isFeasible(rowIndex)) {
                restore()
                return false
            }
            return true
        }

        fun revert() {
            restore()
        }

        fun isComplete(): Boolean {
            for (column in hints.indices) {
                val hintArray = hints[column]
                if (currentRuns[column] > 0) {
                    if (runIndices[column] >= hintArray.size) {
                        return false
                    }
                    if (currentRuns[column] != hintArray[runIndices[column]]) {
                        return false
                    }
                    runIndices[column] = runIndices[column] + 1
                    currentRuns[column] = 0
                }
                if (runIndices[column] != hintArray.size) {
                    return false
                }
            }
            return true
        }

        private fun snapshot() {
            System.arraycopy(runIndices, 0, backupRunIndices, 0, runIndices.size)
            System.arraycopy(currentRuns, 0, backupCurrentRuns, 0, currentRuns.size)
        }

        private fun restore() {
            System.arraycopy(backupRunIndices, 0, runIndices, 0, runIndices.size)
            System.arraycopy(backupCurrentRuns, 0, currentRuns, 0, currentRuns.size)
        }

        private fun isFeasible(rowIndex: Int): Boolean {
            val rowsRemaining = height - rowIndex - 1
            for (column in hints.indices) {
                val hintArray = hints[column]
                var idx = runIndices[column]
                var needed = 0
                if (idx > hintArray.size) {
                    return false
                }
                if (idx < hintArray.size && currentRuns[column] > 0) {
                    val remainingForRun = hintArray[idx] - currentRuns[column]
                    if (remainingForRun < 0) {
                        return false
                    }
                    needed += remainingForRun
                    idx += 1
                    if (idx < hintArray.size) {
                        needed += 1
                    }
                }
                if (idx < hintArray.size) {
                    for (hintIdx in idx until hintArray.size) {
                        needed += hintArray[hintIdx]
                    }
                    val remainingRuns = hintArray.size - idx
                    if (remainingRuns > 1) {
                        needed += remainingRuns - 1
                    }
                }
                if (needed > rowsRemaining) {
                    return false
                }
            }
            return true
        }
    }
}

@Suppress("DataClassShouldBeImmutable")
data class PuzzleSolverResult(
    val uniqueSolution: Boolean,
    val solutionsFound: Int,
    val visitedNodes: Int,
    val difficultyScore: Double,
    val solution: List<List<Int>>?
)
