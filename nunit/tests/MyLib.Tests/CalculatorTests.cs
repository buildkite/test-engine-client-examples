using MyLib;

namespace MyLib.Tests;

public class CalculatorTests
{
    private Calculator _calc = null!;

    [SetUp]
    public void SetUp() => _calc = new Calculator();

    [Test]
    public void Add_ReturnsSumOfTwoNumbers() =>
        Assert.That(_calc.Add(2, 3), Is.EqualTo(5));

    [Test]
    public void Add_HandlesNegativeNumbers() =>
        Assert.That(_calc.Add(-1, -2), Is.EqualTo(-3));

    [Test]
    public void Subtract_ReturnsDifference() =>
        Assert.That(_calc.Subtract(10, 4), Is.EqualTo(6));

    [Test]
    public void Multiply_ReturnsProduct() =>
        Assert.That(_calc.Multiply(3, 7), Is.EqualTo(21));

    [Test]
    public void Divide_ReturnsQuotient() =>
        Assert.That(_calc.Divide(10, 4), Is.EqualTo(2.5));

    [Test]
    public void Divide_ByZero_Throws() =>
        Assert.That(() => _calc.Divide(1, 0), Throws.TypeOf<DivideByZeroException>());

    [TestCase(0, 0, 0)]
    [TestCase(1, 1, 2)]
    [TestCase(100, -50, 50)]
    public void Add_Parameterized(int a, int b, int expected) =>
        Assert.That(_calc.Add(a, b), Is.EqualTo(expected));
}
