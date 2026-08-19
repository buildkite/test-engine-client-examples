# frozen_string_literal: true
require "socket"
require "active_record"
require "net/http"
require "redis"

# We configure OTel SDK from spec_helper.rb,
# so we must require it after all the instrumented libraries are loaded.
# Otherwise, the instrumentations will not be installed and no spans will be captured.
require "spec_helper"

RSpec.describe "OpenTelemetry spans" do
  it "captures an HTTP request" do
    server = TCPServer.new("127.0.0.1", 0)
    server_thread = Thread.new do
      client = server.accept
      while (line = client.gets)
        break if line == "\r\n"
      end
      client.write("HTTP/1.1 200 OK\r\nContent-Length: 2\r\nConnection: close\r\n\r\nOK")
      client.close
    end

    response = Net::HTTP.get_response(URI("http://127.0.0.1:#{server.local_address.ip_port}/health"))

    expect(response).to be_a(Net::HTTPSuccess)
  ensure
    server_thread&.join
    server&.close
  end

  it "captures SQL queries" do
    ActiveRecord::Base.establish_connection(adapter: "sqlite3", database: ":memory:")
    ActiveRecord::Base.connection.create_table(:otel_widgets) do |table|
      table.string :name, null: false
    end
    widget_class = Class.new(ActiveRecord::Base) do
      self.table_name = "otel_widgets"
    end

    widget = widget_class.create!(name: "instrumented")

    expect(widget_class.find(widget.id).name).to eq("instrumented")
  ensure
    ActiveRecord::Base.connection_pool.disconnect!
  end

  it "makes an uninstrumented Redis command" do
    server = TCPServer.new("127.0.0.1", 0)
    server_thread = Thread.new do
      client = server.accept

      loop do
        command = read_redis_command(client)
        client.write("+OK\r\n")
        break if command.first.casecmp?("SET")
      end

      client.close
    end
    redis = Redis.new(
      host: "127.0.0.1",
      port: server.local_address.ip_port,
      protocol: 2,
      connect_timeout: 1,
      read_timeout: 1,
      write_timeout: 1,
    )

    expect(redis.set("otel-demo", "instrumented")).to eq("OK")
  ensure
    redis&.close
    server_thread&.join
    server&.close
  end

  def read_redis_command(client)
    command_length = Integer(client.gets.delete_prefix("*"), 10)

    Array.new(command_length) do
      argument_length = Integer(client.gets.delete_prefix("$"), 10)
      argument = client.read(argument_length)
      client.read(2)
      argument
    end
  end
end
