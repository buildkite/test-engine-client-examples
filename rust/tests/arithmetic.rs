mod tests {
    #[test]
    fn adds() {
        assert_eq!(rust_example::add(7, 5), 12);
    }

    #[test]
    fn adds_zero() {
        assert_eq!(rust_example::add(9, 0), 9);
    }
}
