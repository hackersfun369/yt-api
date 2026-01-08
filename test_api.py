import requests
import json

BASE_URL = 'http://localhost:8080'

def test_endpoint(name, url, method='GET', expected_status=200, redirect=False):
    print(f'Testing {name}...')
    try:
        if redirect:
            response = requests.request(method, url, allow_redirects=False)
            if response.status_code == 302:
                print(f'✅ {name} passed (Redirected to: {response.headers.get("Location")[:50]}...)')
            else:
                print(f'❌ {name} failed: Expected 302 redirect, got {response.status_code}')
        else:
            response = requests.request(method, url)
            if response.status_code == expected_status:
                print(f'✅ {name} passed')
                # Optional: print a snippet of the data
                if 'json' in response.headers.get('Content-Type', ''):
                    data = response.json()
                    if isinstance(data, dict):
                        snippet = {k: v for k, v in data.items() if k in ['id', 'title', 'name', 'results', 'items', 'artistId', 'albumId', 'year', 'language', 'explicit']}
                        print(f'   Snippet: {json.dumps(snippet)[:100]}...')
            else:
                print(f'❌ {name} failed: Status {response.status_code}')
                print(f'   Response: {response.text[:200]}')
    except Exception as e:
        print(f'❌ {name} error: {str(e)}')
    print('-' * 40)

def main():
    print('🧪 Starting Bloomee Dart API Comprehensive Tests...')
    print('Make sure the server is running on http://localhost:8080\n')

    # 1. Root
    test_endpoint('Root', f'{BASE_URL}/')

    # 2. Unified Search
    test_endpoint('Unified Search', f'{BASE_URL}/search?query=Kesariya')

    # 3. JioSaavn Search
    test_endpoint('JioSaavn Search', f'{BASE_URL}/saavn/search?query=Hukum')

    # 4. JioSaavn Metadata
    # Using a known Saavn PID if possible, or just trying with one from search
    test_endpoint('JioSaavn Metadata', f'{BASE_URL}/saavn/metadata/S6N_X_Yh')

    # 5. JioSaavn Audio (Redirect)
    test_endpoint('JioSaavn Audio', f'{BASE_URL}/saavn/audio/S6N_X_Yh', redirect=True)

    # 6. YouTube Search
    test_endpoint('YouTube Search', f'{BASE_URL}/youtube/search?query=Believer')

    # 7. YouTube Metadata
    test_endpoint('YouTube Metadata', f'{BASE_URL}/youtube/metadata/7wtviwvnS_0')

    # 8. YouTube Audio (Redirect)
    test_endpoint('YouTube Audio', f'{BASE_URL}/youtube/audio/7wtviwvnS_0', redirect=True)

if __name__ == '__main__':
    main()
