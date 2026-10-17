package textutil

import "strings"

func Normalize(input string) string {
	return strings.ToLower(strings.TrimSpace(input))
}

func IsPalindrome(input string) bool {
	normalized := Normalize(input)
	runes := []rune(normalized)

	for i, j := 0, len(runes)-1; i < j; i, j = i+1, j-1 {
		if runes[i] != runes[j] {
			return false
		}
	}

	return true
}
