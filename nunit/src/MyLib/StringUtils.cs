namespace MyLib;

public static class StringUtils
{
    public static string Reverse(string input) =>
        new(input.Reverse().ToArray());

    public static bool IsPalindrome(string input) =>
        input.Equals(Reverse(input), StringComparison.OrdinalIgnoreCase);

    public static int WordCount(string input) =>
        string.IsNullOrWhiteSpace(input) ? 0 : input.Split((char[]?)null, StringSplitOptions.RemoveEmptyEntries).Length;
}
