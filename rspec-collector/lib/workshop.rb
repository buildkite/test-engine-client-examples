module Workshop
  def self.wind_safe?(speed_kmh)
    (10..40).cover?(speed_kmh)
  end
end
