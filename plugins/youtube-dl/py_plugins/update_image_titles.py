import json
import sys
import log
import threading
from queue import Queue
from stash_interface import StashInterface

# Global variable that counts the number of processed images
count = 0


def main():
    json_input = readJSONInput()

    client = StashInterface(json_input.get('server_connection'))
    update_image_titles(client)

    output = {
        'output': 'ok'
    }

    print(json.dumps(output) + '\n')


def readJSONInput():
    json_input = sys.stdin.read()
    return json.loads(json_input)


def thread_function(q: Queue, thread_lock: threading.Lock, total: int, client: StashInterface):
    log.LogDebug(f"Created {threading.current_thread().name}")
    thread_lock.acquire()
    global count
    thread_lock.release()
    while not q.empty():
        image = q.get()

        image_data = {
            'id': image.get('id'),
            'title': image.get('title')  # it just works
        }
        if image.get('rating'):
            image_data['rating'] = image.get('rating')
        if image.get('studio'):
            image_data['studio_id'] = image.get('studio').get('id')
        if image.get('performers'):
            performer_ids = [p.get('id') for p in image.get('performers')]
            image_data['performer_ids'] = performer_ids
        if image.get('tags'):
            tag_ids = [t.get('id') for t in image.get('tags')]
            image_data['tag_ids'] = tag_ids
        if image.get('galleries'):
            gallery_ids = [g.get('id') for g in image.get('galleries')]
            image_data['gallery_ids'] = gallery_ids

        client.updateImage(image_data)

        thread_lock.acquire()
        count += 1
        log.LogProgress(count / total)
        thread_lock.release()

        q.task_done()
    log.LogDebug(f"{threading.current_thread().name} finished")
    return True


def update_image_titles(client, nmb_threads=8):
    log.LogInfo('Getting all images with empty title')
    image_filter = {
        'title': {
            'value': '',
            'modifier': 'IS_NULL'
        }
    }
    images = client.findImages(image_filter)
    total = len(images)
    log.LogInfo(f"Found {total} images")
    if total == 0:
        log.LogInfo('Why are you even running this plugin?')
        return

    # nmb of finished images
    global count
    count = 0
    # in the rare case, that there are less than #threads images
    nmb_threads = min(nmb_threads, total)
    thread_lock = threading.Lock()
    q = Queue(maxsize=0)
    for image in images:
        q.put(image)

    log.LogInfo('Start updating images (this might take a while)')
    # Create threads and start them
    for i in range(nmb_threads):
        worker = threading.Thread(target=thread_function, name=f"Thread-{i}", args=(q, thread_lock, total, client))
        worker.start()

    # Wait for all threads to be finished
    q.join()

    log.LogInfo(f'Finished updating all {total} images')


main()
