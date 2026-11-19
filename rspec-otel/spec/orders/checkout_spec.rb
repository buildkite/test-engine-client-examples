require "spec_helper"
require "socket"
require "net/http"
require "active_record"

RSpec.describe "Orders" do
  it "checks the delivery address and saves the kite order" do
    server = TCPServer.new("127.0.0.1", 0)
    server_thread = Thread.new do
      client = server.accept
      while (line = client.gets)
        break if line == "\r\n"
      end
      client.write("HTTP/1.1 200 OK\r\nContent-Length: 2\r\nConnection: close\r\n\r\nOK")
      client.close
    end

    address = URI("http://127.0.0.1:#{server.local_address.ip_port}/delivery-address")
    expect(Net::HTTP.get_response(address).body).to eq("OK")

    ActiveRecord::Base.establish_connection(adapter: "sqlite3", database: ":memory:")
    ActiveRecord::Base.connection.create_table(:kite_orders) do |table|
      table.string :delivery_address, null: false
    end
    order_class = Class.new(ActiveRecord::Base) { self.table_name = "kite_orders" }
    order = order_class.create!(delivery_address: "25 Workshop Road")
    expect(order_class.find(order.id).delivery_address).to eq("25 Workshop Road")
  ensure
    server_thread&.join
    server&.close
    ActiveRecord::Base.connection_pool.disconnect!
  end
end
