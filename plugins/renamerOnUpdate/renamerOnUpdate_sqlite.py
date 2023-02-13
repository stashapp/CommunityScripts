from datetime import datetime
import os
import sqlite3

import log

DB_VERSION_FILE_REFACTOR = 32
DB_VERSION_SCENE_STUDIO_CODE = 38


class Stash:
    """
    handle all db related actions
    """

    def __init__(self, path: str, version: int):
        self.path = path
        self.version = version

    def connect_db(self) -> sqlite3.Connection:
        """
        create a connection to the sqlite db
        """
        try:
            sqlite_connection = sqlite3.connect(self.path, timeout=10)
            log.LogDebug("Python successfully connected to SQLite")
        except sqlite3.Error as error:
            log.LogError(f"FATAL SQLITE Error: {error}")
            return None
        return sqlite_connection

    def db_rename(self, stash_db: sqlite3.Connection, scene_info: dict):
        """
        rename a file in the db
        depending on the database version uses the relevant function
        """
        if self.version >= DB_VERSION_FILE_REFACTOR:
            self.db_rename_refactor(stash_db, scene_info)
        else:
            self.db_rename_old(stash_db, scene_info)

    def db_rename_old(self, stash_db: sqlite3.Connection, scene_info: dict):
        """
        rename in db (for older  version of DB)
        """
        cursor = stash_db.cursor()
        # Database rename
        cursor.execute("UPDATE scenes SET path=? WHERE id=?;",
                       [scene_info['final_path'], scene_info['scene_id']])
        stash_db.commit()
        # Close DB
        cursor.close()

    def db_rename_refactor(self, stash_db: sqlite3.Connection, scene_info: dict):
        """
        rename in db (for FR version of DB)
        """
        cursor = stash_db.cursor()
        # 2022-09-17T11:25:52+02:00
        mod_time = datetime.now().astimezone().isoformat('T', 'seconds')

        # get the next id that we should use if needed
        cursor.execute("SELECT MAX(id) from folders")
        new_id = cursor.fetchall()[0][0] + 1

        # get the old folder id
        cursor.execute("SELECT id FROM folders WHERE path=?",
                       [scene_info['current_directory']])
        old_folder_id = cursor.fetchall()[0][0]

        # check if the folder of file is created in db
        cursor.execute("SELECT id FROM folders WHERE path=?",
                       [scene_info['new_directory']])
        folder_id = cursor.fetchall()
        if not folder_id:
            dir_name = scene_info['new_directory']
            # reduce the path to find a parent folder
            for _ in range(1, len(scene_info['new_directory'].split(os.sep))):
                dir_name = os.path.dirname(dir_name)
                cursor.execute("SELECT id FROM folders WHERE path=?",
                               [dir_name])
                parent_id = cursor.fetchall()
                if parent_id:
                    # create a new row with the new folder with the parent getBfolder find above
                    cursor.execute(
                        "INSERT INTO 'main'.'folders'('id', 'path', 'parent_folder_id', 'mod_time', 'created_at', 'updated_at', 'zip_file_id') VALUES (?, ?, ?, ?, ?, ?, ?);",
                        [
                            new_id, scene_info['new_directory'],
                            parent_id[0][0], mod_time, mod_time, mod_time, None
                        ])
                    stash_db.commit()
                    folder_id = new_id
                    break
        else:
            folder_id = folder_id[0][0]
        if folder_id:
            cursor.execute("SELECT file_id from scenes_files WHERE scene_id=?",
                           [scene_info['scene_id']])
            file_ids = cursor.fetchall()
            file_id = None
            for f_id in file_ids:
                # it can have multiple file for a scene
                cursor.execute("SELECT parent_folder_id from files WHERE id=?",
                               [f_id[0]])
                check_parent = cursor.fetchall()[0][0]
                # if the parent id is the one found above section, we find our file.s
                if check_parent == old_folder_id:
                    file_id = f_id[0]
                    break
            if file_id:
                #log.LogDebug(f"UPDATE files SET basename={scene_info['new_filename']}, parent_folder_id={folder_id}, updated_at={mod_time} WHERE id={file_id};")
                cursor.execute(
                    "UPDATE files SET basename=?, parent_folder_id=?, updated_at=? WHERE id=?;",
                    [scene_info['new_filename'], folder_id, mod_time, file_id])
                cursor.close()
                stash_db.commit()
            else:
                raise Exception("Failed to find file_id")
        else:
            cursor.close()
            raise Exception(
                f"You need to setup a library with the new location ({scene_info['new_directory']}) and scan at least 1 file"
            )
