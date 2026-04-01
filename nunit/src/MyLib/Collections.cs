namespace MyLib;

public class SimpleStack<T>
{
    private readonly List<T> _items = [];

    public int Count => _items.Count;
    public bool IsEmpty => _items.Count == 0;

    public void Push(T item) => _items.Add(item);

    public T Pop()
    {
        if (IsEmpty) throw new InvalidOperationException("Stack is empty");
        var item = _items[^1];
        _items.RemoveAt(_items.Count - 1);
        return item;
    }

    public T Peek()
    {
        if (IsEmpty) throw new InvalidOperationException("Stack is empty");
        return _items[^1];
    }
}
