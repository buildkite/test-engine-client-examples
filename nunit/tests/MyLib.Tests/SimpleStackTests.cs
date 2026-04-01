using MyLib;

namespace MyLib.Tests;

public class SimpleStackTests
{
    private SimpleStack<int> _stack = null!;

    [SetUp]
    public void SetUp() => _stack = new SimpleStack<int>();

    [Test]
    public void NewStack_IsEmpty() =>
        Assert.That(_stack.IsEmpty, Is.True);

    [Test]
    public void Push_IncreasesCount()
    {
        _stack.Push(1);
        Assert.That(_stack.Count, Is.EqualTo(1));
    }

    [Test]
    public void Pop_ReturnsLastPushedItem()
    {
        _stack.Push(1);
        _stack.Push(2);
        Assert.That(_stack.Pop(), Is.EqualTo(2));
    }

    [Test]
    public void Pop_DecreasesCount()
    {
        _stack.Push(1);
        _stack.Pop();
        Assert.That(_stack.Count, Is.EqualTo(0));
    }

    [Test]
    public void Pop_WhenEmpty_Throws() =>
        Assert.That(() => _stack.Pop(), Throws.TypeOf<InvalidOperationException>());

    [Test]
    public void Peek_ReturnsTopWithoutRemoving()
    {
        _stack.Push(42);
        Assert.That(_stack.Peek(), Is.EqualTo(42));
        Assert.That(_stack.Count, Is.EqualTo(1));
    }

    [Test]
    public void Peek_WhenEmpty_Throws() =>
        Assert.That(() => _stack.Peek(), Throws.TypeOf<InvalidOperationException>());
}
