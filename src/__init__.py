import json
import os


def load_notified_ids() -> list:
    json_path = "/data/notified_ids.json"
    if os.environ.get("IDS_PATH"):
        json_path = os.environ["IDS_PATH"]

    notified_ids = []
    if os.path.exists(json_path):
        with open(json_path, "r") as f:
            notified_ids = json.load(f)
    return notified_ids


def add_notified_id(notified_id):
    notified_ids = load_notified_ids()
    notified_ids.append(notified_id)
    save_notified_ids(notified_ids)


def save_notified_ids(notified_ids: list):
    json_path = "/data/notified_ids.json"
    if os.environ.get("IDS_PATH"):
        json_path = os.environ["IDS_PATH"]

    with open(json_path, "w") as f:
        f.write(json.dumps(notified_ids))


def remove_html_tags(text):
    """Remove html tags from a string"""
    import re
    clean = re.compile('<.*?>')
    return re.sub(clean, '', text)
