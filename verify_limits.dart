import 'dart:convert';
import 'package:http/http.dart' as http;

void main() async {
  final queries = [
    'http://localhost:8080/search?query=Kesariya&n=5',
    'http://localhost:8080/saavn/search?query=Kesariya&n=5',
    'http://localhost:8080/youtube/search?query=Kesariya&n=5'
  ];

  for (var url in queries) {
    try {
      final response = await http.get(Uri.parse(url));
      final data = jsonDecode(response.body);
      final list = data['results'] ?? data['items'];
      print('URL: $url -> Count: ${list.length}');
    } catch (e) {
      print('Error testing $url: $e');
    }
  }
}
