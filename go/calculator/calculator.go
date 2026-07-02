package calculator

func Add(a, b int) int {
	return a + b
}

func Divide(a, b int) (int, bool) {
	if b == 0 {
		return 0, false
	}

	return a / b, true
}
