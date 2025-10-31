package org.example.kotlin_liargame.domain.nemonemo.V1.model

object PuzzleGridCodec {

    fun fromStringRows(rows: List<String>): Array<BooleanArray> {
        require(rows.isNotEmpty()) { "Solution grid must contain at least one row" }
        val width = rows.first().length
        require(width > 0) { "Solution grid width must be positive" }
        val grid = Array(rows.size) { BooleanArray(width) }
        rows.forEachIndexed { rowIdx, rowValue ->
            require(rowValue.length == width) {
                "Row $rowIdx has inconsistent width: expected $width but was ${rowValue.length}"
            }
            rowValue.forEachIndexed { columnIdx, char ->
                grid[rowIdx][columnIdx] = when (char) {
                    '#', 'X', '1' -> true
                    '.', '0', ' ', '_' -> false
                    else -> error("Unsupported cell character '$char' at ($rowIdx,$columnIdx)")
                }
            }
        }
        return grid
    }

    fun encode(grid: Array<BooleanArray>): ByteArray {
        val height = grid.size
        require(height > 0) { "Grid height must be positive" }
        val width = grid.first().size
        require(width > 0) { "Grid width must be positive" }
        grid.forEachIndexed { rowIdx, row ->
            require(row.size == width) {
                "Row $rowIdx has inconsistent width: expected $width but was ${row.size}"
            }
        }
        val bitCount = width * height
        val bytes = ByteArray((bitCount + 7) / 8)
        var bitIndex = 0
        for (row in grid) {
            for (cell in row) {
                val byteIndex = bitIndex / 8
                val bitOffset = bitIndex % 8
                if (cell) {
                    bytes[byteIndex] = bytes[byteIndex] or (1 shl bitOffset).toByte()
                }
                bitIndex++
            }
        }
        return bytes
    }

    fun decode(blob: ByteArray, width: Int, height: Int): Array<BooleanArray> {
        require(width > 0 && height > 0) { "Width and height must be positive" }
        val bitCount = width * height
        require(blob.size * 8 >= bitCount) { "Blob does not contain enough data for grid" }
        val grid = Array(height) { BooleanArray(width) }
        var bitIndex = 0
        for (row in 0 until height) {
            for (col in 0 until width) {
                val byteIndex = bitIndex / 8
                val bitOffset = bitIndex % 8
                val mask = (1 shl bitOffset).toByte()
                grid[row][col] = (blob[byteIndex].toInt() and mask.toInt()) != 0
                bitIndex++
            }
        }
        return grid
    }

    private infix fun Byte.or(other: Byte): Byte {
        return (this.toInt() or other.toInt()).toByte()
    }
}
