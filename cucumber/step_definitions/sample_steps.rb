Given('I have two numbers {int} and {int}') do |int, int2|
  @number1 = int
  @number2 = int2
end

When('I add them') do
  @result = @number1 + @number2
end

Then('the result should be {int}') do |int|
  expect(@result).to eq(int)
end
