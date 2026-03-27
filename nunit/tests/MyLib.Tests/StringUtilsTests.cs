using MyLib;

namespace MyLib.Tests;

public class StringUtilsTests
{
    [Test]
    public void Reverse_ReversesString() =>
        Assert.That(StringUtils.Reverse("hello"), Is.EqualTo("olleh"));

    [Test]
    public void Reverse_EmptyString_ReturnsEmpty() =>
        Assert.That(StringUtils.Reverse(""), Is.EqualTo(""));

    [Test]
    public void IsPalindrome_True_ForPalindrome() =>
        Assert.That(StringUtils.IsPalindrome("racecar"), Is.True);

    [Test]
    public void IsPalindrome_True_CaseInsensitive() =>
        Assert.That(StringUtils.IsPalindrome("Madam"), Is.True);

    [Test]
    public void IsPalindrome_False_ForNonPalindrome() =>
        Assert.That(StringUtils.IsPalindrome("hello"), Is.False);

    [TestCase("hello world", 2)]
    [TestCase("one", 1)]
    [TestCase("  spaced  out  ", 2)]
    [TestCase("", 0)]
    public void WordCount_ReturnsCorrectCount(string input, int expected) =>
        Assert.That(StringUtils.WordCount(input), Is.EqualTo(expected));
}
