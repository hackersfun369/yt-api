import 'dart:convert';
import 'dart:io';
import 'dart:typed_data';
import 'package:http/http.dart' as http;
import 'package:shelf/shelf.dart';
import 'package:shelf/shelf_io.dart';
import 'package:shelf_router/shelf_router.dart';
import 'package:shelf_cors_headers/shelf_cors_headers.dart';
import 'package:youtube_explode_dart/youtube_explode_dart.dart';

void main(List<String> args) async {
  final ip = InternetAddress.anyIPv4;
  final port = int.parse(Platform.environment['PORT'] ?? '8080');

  final handler = Pipeline()
      .addMiddleware(logRequests())
      .addMiddleware(corsHeaders())
      .addHandler(_router);

  final server = await serve(handler, ip, port);
  print('🚀 Bloomee Dart API running on http://${server.address.host}:${server.port}');
}

// --- YouTube Helpers & Handlers ---
const _ytmApiKey = 'AIzaSyC9XL3ZjWddXya6X74dJoCTL-WEYFDNX30';
const _ytmBaseUrl = 'https://music.youtube.com/youtubei/v1';

int _timeStringToSeconds(String? time) {
  if (time == null || time.isEmpty) return 0;
  final parts = time.split(':').map((p) => int.tryParse(p) ?? 0).toList();
  if (parts.length == 3) return (parts[0] * 3600) + (parts[1] * 60) + parts[2];
  if (parts.length == 2) return (parts[0] * 60) + parts[1];
  return parts[0];
}

Future<Map<String, dynamic>> _sendYtmRequest(String endpoint, Map<String, dynamic> body) async {
  final date = DateTime.now().toIso8601String().split('T')[0].replaceAll('-', '');
  body['context'] ??= {
    'client': {
      'clientName': 'WEB_REMIX',
      'clientVersion': '1.$date.01.00',
      'hl': 'en',
      'gl': 'US',
    }
  };

  final response = await http.post(
    Uri.parse('$_ytmBaseUrl/$endpoint?key=$_ytmApiKey'),
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Origin': 'https://music.youtube.com',
    },
    body: jsonEncode(body),
  );

  return jsonDecode(response.body);
}

Map<String, dynamic> _parseYtmItem(dynamic renderer, {bool isCard = false}) {
  dynamic videoId;
  if (isCard) {
    videoId = renderer['buttons']?[0]?['buttonRenderer']?['command']?['watchEndpoint']?['videoId'];
  } else {
    videoId = renderer['playlistItemData']?['videoId'];
  }
  
  if (videoId == null) return {};

  String? title;
  if (isCard) {
    title = renderer['title']?['runs']?[0]?['text'];
  } else {
    final flexColumns = renderer['flexColumns'] as List?;
    if (flexColumns != null && flexColumns.isNotEmpty) {
      title = flexColumns[0]?['musicResponsiveListItemFlexColumnRenderer']?['text']?['runs']?[0]?['text'];
    }
  }

  List? runs;
  if (isCard) {
    runs = renderer['subtitle']?['runs'] as List?;
  } else {
    final flexColumns = renderer['flexColumns'] as List?;
    if (flexColumns != null && flexColumns.length > 1) {
      runs = flexColumns[1]?['musicResponsiveListItemFlexColumnRenderer']?['text']?['runs'] as List?;
    }
  }
  final finalRuns = runs ?? [];

  String? artist, artistId, album, albumId, year, duration;

  for (var run in finalRuns) {
    if (run is! Map) continue;
    final text = run['text']?.toString() ?? '';
    final endpoint = run['navigationEndpoint']?['browseEndpoint'];
    final pageType = endpoint?['browseEndpointContextSupportedConfigs']?['browseEndpointContextMusicConfig']?['pageType'];

    if (text.trim() == '•' || text.trim() == '·') continue;

    if (pageType == 'MUSIC_PAGE_TYPE_ARTIST') {
      artist = (artist == null) ? text : '$artist, $text';
      artistId ??= endpoint['browseId'];
    } else if (pageType == 'MUSIC_PAGE_TYPE_ALBUM') {
      album = text;
      albumId = endpoint['browseId'];
    } else if (text.contains(':')) {
      duration = text;
    } else if (int.tryParse(text) != null && text.length == 4) {
      year = text;
    } else if (artist == null && !['Song', 'Video', 'Single', 'Playlist', 'Album'].contains(text.trim())) {
      artist = text;
    }
  }

  final List thumbnails = renderer['thumbnail']?['musicThumbnailRenderer']?['thumbnail']?['thumbnails'] ?? [];
  final String image = thumbnails.isNotEmpty ? thumbnails.last['url'] : '';

  // Extract explicit badge
  final bool explicit = renderer['badges']?.any((b) => b['musicInlineBadgeRenderer']?['icon']?['iconType'] == 'MUSIC_EXPLICIT_BADGE') ?? false;

  return {
    'id': videoId,
    'title': title ?? 'Unknown',
    'name': title ?? 'Unknown',
    'artist': artist ?? 'Unknown',
    'artistId': artistId,
    'singers': artist ?? 'Unknown',
    'album': album ?? 'YouTube Music',
    'albumId': albumId,
    'year': year,
    'duration': _timeStringToSeconds(duration).toString(),
    'image': image.replaceAll('w60-h60', 'w400-h400').replaceAll('w120-h120', 'w400-h400'),
    'explicit': explicit,
    'provider': 'youtube',
  };
}

// --- JioSaavn Helpers & Handlers ---
const _saavnBaseUrl = 'https://www.jiosaavn.com/api.php?_format=json&_marker=0&cc=in&includeMetaTags=1';

Future<dynamic> _fetchSaavn(Map<String, String> params) async {
  final uri = Uri.parse(_saavnBaseUrl).replace(queryParameters: {...Uri.parse(_saavnBaseUrl).queryParameters, ...params});
  final response = await http.get(uri, headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  });
  return jsonDecode(response.body);
}

String _decodeHtml(String? html) {
  if (html == null) return '';
  return html.replaceAll('&quot;', '"').replaceAll('&amp;', '&').replaceAll('&#039;', "'").replaceAll('&lt;', '<').replaceAll('&gt;', '>').replaceAll('&nbsp;', ' ');
}

Map<String, dynamic> _formatSaavnSong(Map<String, dynamic> song) {
  // We now route Saavn audio through our dedicated handler to ensure token generation and 100% reliability.
  final id = song['id'];
  final audioUrl = '/saavn/audio/$id';

  return {
    'id': id,
    'name': _decodeHtml(song['song'] ?? song['title']),
    'title': _decodeHtml(song['song'] ?? song['title']),
    'singers': _decodeHtml(song['singers'] ?? song['primary_artists']),
    'artist': _decodeHtml(song['singers'] ?? song['primary_artists']),
    'artistId': song['primary_artists_id'] ?? song['singers_id'],
    'album': _decodeHtml(song['album']),
    'albumId': song['albumid'],
    'duration': song['duration']?.toString() ?? '0',
    'year': song['year']?.toString(),
    'language': song['language']?.toString(),
    'image': song['image']?.toString().replaceAll('150x150', '500x500') ?? '',
    'explicit': (song['explicit_content']?.toString() == '1' || song['explicit']?.toString() == 'true'),
    'audioUrl': audioUrl,
    'provider': 'saavn'
  };
}

// --- Router Definition ---
final _router = Router()
  ..get('/', (Request req) => Response.ok('Bloomee Unified Dart API is running! 🚀'))
  ..get('/search', _unifiedSearchHandler)
  // JioSaavn Endpoints
  ..get('/saavn/search', _saavnSearchHandler)
  ..get('/saavn/metadata/<id>', _saavnMetadataHandler)
  ..get('/saavn/audio/<id>', _saavnAudioHandler)
  ..get('/saavn/next/<id>', _saavnNextHandler)
  ..get('/saavn/trending', _saavnTrendingHandler)
  ..get('/saavn/album/<id>', _saavnAlbumHandler)
  ..get('/saavn/playlist/<id>', _saavnPlaylistHandler)
  // YouTube Endpoints
  ..get('/youtube/search', _youtubeSearchHandler)
  ..get('/youtube/metadata/<id>', _youtubeMetadataHandler)
  ..get('/youtube/audio/<id>', _youtubeAudioHandler)
  ..get('/youtube/next/<id>', _youtubeNextHandler)
  ..get('/youtube/suggestions', _youtubeSuggestionsHandler)
  ..get('/youtube/trending', _youtubeTrendingHandler)
  ..get('/youtube/playlist/<id>', _youtubePlaylistHandler);

// --- Handler Implementations ---

Future<Response> _unifiedSearchHandler(Request req) async {
  final query = req.url.queryParameters['query'];
  if (query == null) return Response.badRequest(body: 'Missing query');
  
  final limitStr = req.url.queryParameters['n'] ?? req.url.queryParameters['limit'] ?? '20';
  final n = int.tryParse(limitStr) ?? 20;

  try {
    final results = await Future.wait([
      _fetchSaavn({'__call': 'search.getResults', 'q': query, 'n': '20'}),
      _sendYtmRequest('search', {'query': query, 'params': 'EgWKAQIIAWoKEAkQAxAEEAkQBRgA'})
    ]);

    final saavnData = results[0] as Map<String, dynamic>;
    final youtubeData = results[1] as Map<String, dynamic>;

    final saavnSongs = (saavnData['results'] as List? ?? []).map((s) => _formatSaavnSong(s as Map<String, dynamic>)).toList();
    
    final List<Map<String, dynamic>> youtubeSongs = [];
    final sections = youtubeData['contents']?['tabbedSearchResultsRenderer']?['tabs']?[0]?['tabRenderer']?['content']?['sectionListRenderer']?['contents'] ?? [];
    for (var section in sections) {
      final shelf = section['musicShelfRenderer'];
      if (shelf == null) continue;
      final shelfItems = shelf['contents'] ?? [];
      for (var item in shelfItems) {
        final renderer = item['musicResponsiveListItemRenderer'];
        if (renderer == null) continue;
        final parsed = _parseYtmItem(renderer);
        if (parsed.isNotEmpty) youtubeSongs.add(parsed);
      }
    }

    // Combine and apply global limit
    final combined = [...saavnSongs, ...youtubeSongs];
    final limited = combined.length > n ? combined.sublist(0, n) : combined;

    return Response.ok(jsonEncode({'results': limited}), headers: {'content-type': 'application/json'});
  } catch (e) {
    return Response.internalServerError(body: e.toString());
  }
}

Future<Response> _saavnSearchHandler(Request req) async {
  final query = req.url.queryParameters['query'];
  final limitStr = req.url.queryParameters['n'] ?? req.url.queryParameters['limit'] ?? '20';
  try {
    final data = await _fetchSaavn({'__call': 'search.getResults', 'q': query ?? '', 'n': limitStr});
    final results = (data['results'] as List? ?? []).map((s) => _formatSaavnSong(s as Map<String, dynamic>)).toList();
    return Response.ok(jsonEncode({'items': results}), headers: {'content-type': 'application/json'});
  } catch (e) { return Response.internalServerError(body: e.toString()); }
}

Future<Response> _saavnMetadataHandler(Request req, String id) async {
  try {
    print('DEBUG: Requesting Saavn metadata for ID: $id');
    final dynamic data = await _fetchSaavn({'__call': 'song.getDetails', 'pids': id});
    print('DEBUG: Saavn data received: ${jsonEncode(data)}');
    if (data is! Map || data.isEmpty) return Response.notFound('Song not found');
    
    dynamic songNode;
    if (data.containsKey('songs')) {
      final songs = data['songs'];
      if (songs is List && songs.isNotEmpty) songNode = songs.first;
    } else {
      songNode = data[data.keys.first];
    }
    
    print('DEBUG: Identified song node: ${jsonEncode(songNode)}');
    if (songNode is! Map) return Response.notFound('Invalid song data structure');
    return Response.ok(jsonEncode(_formatSaavnSong(Map<String, dynamic>.from(songNode))), headers: {'content-type': 'application/json'});
  } catch (e) { 
    print('DEBUG: Saavn metadata ERROR: $e');
    return Response.internalServerError(body: e.toString()); 
  }
}

Future<Response> _saavnAudioHandler(Request req, String id) async {
  try {
    final dynamic data = await _fetchSaavn({'__call': 'song.getDetails', 'pids': id});
    if (data is! Map || data.isEmpty) return Response.notFound('Song not found');
    
    dynamic songNode;
    if (data.containsKey('songs')) {
      final songs = data['songs'];
      if (songs is List && songs.isNotEmpty) songNode = songs.first;
    } else {
      songNode = data[data.keys.first];
    }
    
    if (songNode is! Map) return Response.notFound('Invalid song data structure');
    
    final encryptedUrl = songNode['encrypted_media_url']?.toString() ?? '';
    if (encryptedUrl.isEmpty) return Response.notFound('Audio not available');

    // Generate Auth Token for direct stream
    final authData = await _fetchSaavn({
      '__call': 'song.generateAuthToken',
      'url': encryptedUrl,
      'bitrate': '320',
      'api_version': '4',
    });

    final authUrl = authData['auth_url']?.toString() ?? '';
    if (authUrl.isNotEmpty) {
      return Response.found(authUrl);
    }

    return Response.notFound('Failed to generate high-quality audio URL');
  } catch (e) { return Response.internalServerError(body: e.toString()); }
}

Future<Response> _youtubeSearchHandler(Request req) async {
  final query = req.url.queryParameters['query'];
  final filter = req.url.queryParameters['filter'] ?? 'song';
  final limitStr = req.url.queryParameters['n'] ?? req.url.queryParameters['limit'] ?? '20';
  final n = int.tryParse(limitStr) ?? 20;
  
  String params = 'EgWKAQIIAWoKEAkQAxAEEAkQBRgA'; // Default to Songs
  if (filter == 'video') params = 'EgWKAQIQAWoKEAkQAxAEEAkQBRgA';
  else if (filter == 'album') params = 'EgWKAQIYAWoKEAkQAxAEEAkQBRgA';
  else if (filter == 'artist') params = 'EgWKAQI4AWoKEAkQAxAEEAkQBRgA';
 
  try {
    final data = await _sendYtmRequest('search', {
      'query': query ?? '',
      'params': params,
    });
    final List<Map<String, dynamic>> items = [];
    final sections = data['contents']?['tabbedSearchResultsRenderer']?['tabs']?[0]?['tabRenderer']?['content']?['sectionListRenderer']?['contents'] ?? [];
    for (var section in sections) {
      final shelf = section['musicShelfRenderer'];
      if (shelf == null) continue;
      final shelfItems = shelf['contents'] ?? [];
      for (var item in shelfItems) {
        final renderer = item['musicResponsiveListItemRenderer'];
        if (renderer == null) continue;
        final parsed = _parseYtmItem(renderer, isCard: false);
        if (parsed.isNotEmpty) items.add(parsed);
      }
    }
    
    final limited = items.length > n ? items.sublist(0, n) : items;
    return Response.ok(jsonEncode({'items': limited}), headers: {'content-type': 'application/json'});
  } catch (e) { return Response.internalServerError(body: e.toString()); }
}

Future<Response> _youtubeMetadataHandler(Request req, String id) async {
  final yt = YoutubeExplode();
  try {
    final video = await yt.videos.get(id);
    return Response.ok(jsonEncode({
      'id': video.id.value,
      'title': video.title,
      'author': video.author,
      'duration': video.duration?.toString(),
      'image': video.thumbnails.highResUrl.toString(),
      'provider': 'youtube'
    }), headers: {'content-type': 'application/json'});
  } catch (e) { return Response.internalServerError(body: e.toString()); } finally { yt.close(); }
}

Future<Response> _youtubeNextHandler(Request req, String id) async {
  try {
    final data = await _sendYtmRequest('next', {'videoId': id});
    final List<Map<String, dynamic>> items = [];
    final results = data['contents']?['singleColumnMusicWatchNextResultsRenderer']?['tabbedRenderer']?['watchNextTabbedResultsRenderer']?['tabs']?[0]?['tabRenderer']?['content']?['musicQueueRenderer']?['content']?['playlistPanelRenderer']?['contents'] ?? [];
    
    for (var item in results) {
      final renderer = item['playlistPanelVideoRenderer'];
      if (renderer == null) continue;
      
      final title = renderer['title']?['runs']?[0]?['text'];
      final String videoId = renderer['videoId'];
      final List runs = (renderer['longBylineText']?['runs'] ?? renderer['shortBylineText']?['runs']) as List? ?? [];
      
      String? artist, album, duration;
      for (var run in runs) {
        final text = run['text']?.toString() ?? '';
        final pageType = run['navigationEndpoint']?['browseEndpoint']?['browseEndpointContextSupportedConfigs']?['browseEndpointContextMusicConfig']?['pageType'];
        if (pageType == 'MUSIC_PAGE_TYPE_ARTIST') artist = (artist == null) ? text : '$artist, $text';
        else if (pageType == 'MUSIC_PAGE_TYPE_ALBUM') album = text;
        else if (text.contains(':')) duration = text;
      }

      final thumbnails = renderer['thumbnail']?['thumbnails'] ?? [];
      final image = thumbnails.isNotEmpty ? thumbnails.last['url'] : '';

      items.add({
        'id': videoId,
        'title': title,
        'name': title,
        'artist': artist ?? 'Unknown',
        'singers': artist ?? 'Unknown',
        'album': album ?? 'Up Next',
        'duration': _timeStringToSeconds(duration).toString(),
        'image': image,
        'provider': 'youtube'
      });
    }
    return Response.ok(jsonEncode({'items': items}), headers: {'content-type': 'application/json'});
  } catch (e) { return Response.internalServerError(body: e.toString()); }
}

Future<Response> _youtubeSuggestionsHandler(Request req) async {
  final query = req.url.queryParameters['query'];
  if (query == null) return Response.badRequest(body: 'Missing query');
  try {
    final data = await _sendYtmRequest('music/get_search_suggestions', {
      'input': query,
    });
    final List suggestions = (data['contents']?[0]?['searchSuggestionsSectionRenderer']?['contents'] ?? []);
    final List<String> items = [];
    for (var s in suggestions) {
      final text = s['searchSuggestionRenderer']?['suggestion']?['runs']?.map((r) => r['text']).join('');
      if (text != null) items.add(text);
    }
    return Response.ok(jsonEncode({'suggestions': items}), headers: {'content-type': 'application/json'});
  } catch (e) { return Response.internalServerError(body: e.toString()); }
}

Future<Response> _youtubeTrendingHandler(Request req) async {
  try {
    // Trending in Music charts
    final data = await _sendYtmRequest('browse', {'browseId': 'FEmusic_charts'});
    final List<Map<String, dynamic>> items = [];
    
    // This part of InnerTube is extremely deep, simplified extraction
    final sections = data['contents']?['singleColumnBrowseResultsRenderer']?['tabs']?[0]?['tabRenderer']?['content']?['sectionListRenderer']?['contents'] ?? [];
    for (var section in sections) {
      final shelf = section['musicCarouselShelfRenderer'] ?? section['musicShelfRenderer'];
      if (shelf == null) continue;
      final shelfItems = shelf['contents'] ?? [];
      for (var item in shelfItems) {
        final renderer = item['musicResponsiveListItemRenderer'] ?? item['musicTwoColumnItemRenderer'];
        if (renderer == null) continue;
        final parsed = _parseYtmItem(renderer);
        if (parsed.isNotEmpty) items.add(parsed);
      }
    }
    return Response.ok(jsonEncode({'items': items}), headers: {'content-type': 'application/json'});
  } catch (e) { return Response.internalServerError(body: e.toString()); }
}

Future<Response> _youtubePlaylistHandler(Request req, String id) async {
  try {
    final data = await _sendYtmRequest('browse', {'browseId': id.startsWith('PL') || id.startsWith('VL') ? id : 'VL$id'});
    final List<Map<String, dynamic>> items = [];
    final results = data['contents']?['singleColumnBrowseResultsRenderer']?['tabs']?[0]?['tabRenderer']?['content']?['sectionListRenderer']?['contents']?[0]?['musicPlaylistShelfRenderer']?['contents'] ?? [];
    
    for (var item in results) {
      final renderer = item['musicResponsiveListItemRenderer'];
      if (renderer == null) continue;
      final parsed = _parseYtmItem(renderer);
      if (parsed.isNotEmpty) items.add(parsed);
    }
    return Response.ok(jsonEncode({'items': items}), headers: {'content-type': 'application/json'});
  } catch (e) { return Response.internalServerError(body: e.toString()); }
}

Future<Response> _youtubeAudioHandler(Request req, String id) async {
  final yt = YoutubeExplode();
  try {
    final manifest = await yt.videos.streamsClient.getManifest(id, ytClients: [YoutubeApiClient.androidVr]);
    final stream = manifest.audioOnly.withHighestBitrate();
    if (stream == null) return Response.notFound('No stream');
    return Response.found(stream.url.toString());
  } catch (e) { return Response.internalServerError(body: e.toString()); } finally { yt.close(); }
}

Future<Response> _saavnNextHandler(Request req, String id) async {
  try {
    final data = await _fetchSaavn({'__call': 'reco.getreco', 'pid': id});
    final results = (data as List? ?? []).map((s) => _formatSaavnSong(s as Map<String, dynamic>)).toList();
    return Response.ok(jsonEncode({'items': results}), headers: {'content-type': 'application/json'});
  } catch (e) { return Response.internalServerError(body: e.toString()); }
}

Future<Response> _saavnTrendingHandler(Request req) async {
  try {
    final data = await _fetchSaavn({'__call': 'content.getCharts'});
    final List<Map<String, dynamic>> items = [];
    for (var chart in (data as List? ?? [])) {
      items.add({
        'id': chart['id'],
        'title': _decodeHtml(chart['title']),
        'image': chart['image']?.toString().replaceAll('150x150', '500x500') ?? '',
        'type': 'chart'
      });
    }
    return Response.ok(jsonEncode({'items': items}), headers: {'content-type': 'application/json'});
  } catch (e) { return Response.internalServerError(body: e.toString()); }
}

Future<Response> _saavnAlbumHandler(Request req, String id) async {
  try {
    final data = await _fetchSaavn({'__call': 'content.getAlbumDetails', 'albumid': id});
    final List songs = data['songs'] as List? ?? [];
    final results = songs.map((s) => _formatSaavnSong(s as Map<String, dynamic>)).toList();
    return Response.ok(jsonEncode({
      'id': data['id'],
      'title': _decodeHtml(data['title']),
      'image': data['image']?.toString().replaceAll('150x150', '500x500') ?? '',
      'items': results
    }), headers: {'content-type': 'application/json'});
  } catch (e) { return Response.internalServerError(body: e.toString()); }
}

Future<Response> _saavnPlaylistHandler(Request req, String id) async {
  try {
    final data = await _fetchSaavn({'__call': 'playlist.getDetails', 'listid': id});
    final List songs = data['songs'] as List? ?? [];
    final results = songs.map((s) => _formatSaavnSong(s as Map<String, dynamic>)).toList();
    return Response.ok(jsonEncode({
      'id': data['id'],
      'title': _decodeHtml(data['listname'] ?? data['title']),
      'image': data['image']?.toString().replaceAll('150x150', '500x500') ?? '',
      'items': results
    }), headers: {'content-type': 'application/json'});
  } catch (e) { return Response.internalServerError(body: e.toString()); }
}
