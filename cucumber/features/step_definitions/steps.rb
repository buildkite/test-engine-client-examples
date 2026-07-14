Given("a user") do
  @user = { name: "Bob", logged_in: false }
end

Given("a logged in user") do
  @user = { name: "Bob", logged_in: true }
end

Given("a user named {string}") do |name|
  @user = { name: name, logged_in: false }
end

When("they log in") do
  @user[:logged_in] = true
end

When("they log out") do
  @user[:logged_in] = false
end

Then("they are logged in") do
  raise "expected user to be logged in" unless @user[:logged_in]
end

Then("they are redirected to the dashboard") do
  raise "expected user to be logged in" unless @user[:logged_in]
end

Then("they are logged out") do
  raise "expected user to be logged out" if @user[:logged_in]
end

Then("their name is {string}") do |name|
  Buildkite::TestCollector.tag_execution("custom.tag.from", "execution")
  raise "expected name to be #{name}" unless @user[:name] == name
end

Then("it fails") do
  raise "this scenario always fails"
end
