require 'csv'

headers = nil
values = nil
join_tables = [
  'display_auspices', 'display_authors', 'display_booksellers',
  'display_companies', 'display_printers', 'display_publishers'
]
CSV.foreach('data/deep-export.csv') do |row|
  if headers
    row.length.times do |i|
      next unless row[i]
      tmp = nil
      if join_tables.include? headers[i]
        tmp = row[i].split(';').map do |v|
          v.strip
        end
      else
        tmp = [row[i]]
      end
      tmp.each do |v|
        v.strip!
        v.sub!(/\s+\(\?\)$/,'')
      end
      values[i] += tmp
    end
  else
    headers = row
    values = row.length.times.collect { [] }
  end
end

values.each_with_index do |v, i|
  v.uniq!
  v.delete_if { |va| va.nil? || va == '' }
end


headers.length.times do |i|
  CSV.open("data/transform/#{headers[i]}.csv", "wb") do |csv|
    csv << ['id', 'label']
    values[i].each_with_index do |value, j|
      csv << [j, value]
    end
  end
end

join_tables.each do |join_to|
  join_id = join_to.downcase.sub(/display_/,'').sub(/s$/,'') + '_id'
  CSV.open("data/transform/join_#{join_to}.csv", "wb") do |csv|
    csv << ["deep_id", "#{join_id}","uncertain"]
  end
end

deep_headers = headers.reject {|h| join_tables.include?(h)}
CSV.open("data/transform/deep.csv", "wb") do |csv|
  csv << deep_headers
end

headers = nil
rows = []
CSV.foreach('data/deep-export.csv') do |row|
  if headers
    row.length.times do |i|
      next unless row[i]
      tmp = nil
      if join_tables.include? headers[i]
        join_to = headers[i]
        tmp = row[i].split(';').map do |v|
          v.strip
        end
        tmp.each do |tmp_val|
          q = tmp_val.sub!(/\s+\(\?\)$/,'')
          ix = values[i].index(tmp_val)
          CSV.open("data/transform/join_#{join_to}.csv", "ab") do |csv|
            csv << [row[0], ix.to_s, !!q]
          end
        end
      end
    end
    filtered = deep_headers.map { |hdr| row[headers.index(hdr)]}
    CSV.open("data/transform/deep.csv", "ab") do |csv|
      csv << filtered
    end
  else
    headers = row
  end
end

