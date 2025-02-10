""" 
openedFile (By David Maisonave aka Axter) 
https://github.com/David-Maisonave/Axter-Stash/tree/main/plugins/RenameFile

Description:
    Close all (open file) handles on all processes for a given file.
Use Case:
    Can be used when a file needs to be deleted or moved, 
    but the file is locked by one or more other processes.
Requirements:
    This class requires Sysinternals handle.exe, which can be downloaded from following link:
    https://learn.microsoft.com/en-us/sysinternals/downloads/handle
Important: **MUST call this class in admin mode with elevated privileges!!!**
Example Usage:
    handleExe = r"C:\Sysinternals\handle64.exe"
    of = openedFile(handleExe)
    of.closeFile(r"B:\V\V\testdup\deleme2.mp4")
    
"""
import ctypes, os, sys, argparse, traceback, logging, numbers, string
from ctypes import wintypes
# from StashPluginHelper import StashPluginHelper
# Look at the following links to enhance this code:
#   https://stackoverflow.com/questions/35106511/how-to-access-the-peb-of-another-process-with-python-ctypes
#   https://www.codeproject.com/Articles/19685/Get-Process-Info-with-NtQueryInformationProcess

# Important: MUST call this class in admin mode with elevated privileges!!!
#            This class has member function runMeAsAdmin, which will elevate privileges.
#            When member function closeFile is called, it will call runMeAsAdmin as needed.
#            getPid is the only function which does NOT require elevated admin privileges.
class openedFile():
    # generic strings and constants
    ntdll = None
    kernel32 = None
    NTSTATUS = wintypes.LONG
    INVALID_HANDLE_VALUE = wintypes.HANDLE(-1).value
    FILE_READ_ATTRIBUTES = 0x80
    FILE_SHARE_READ = 1
    OPEN_EXISTING = 3
    FILE_FLAG_BACKUP_SEMANTICS = 0x02000000
    FILE_INFORMATION_CLASS = wintypes.ULONG
    FileProcessIdsUsingFileInformation = 47 # see https://learn.microsoft.com/en-us/windows-hardware/drivers/ddi/wdm/ne-wdm-_file_information_class
    LPSECURITY_ATTRIBUTES = wintypes.LPVOID
    ULONG_PTR = wintypes.WPARAM
    lastPath = None
    handleExe = None
    stash = None
    
    def __init__(self, handleExe, stash = None):
        self.handleExe = handleExe
        self.stash = stash
        if handleExe == None or handleExe == "" or not os.path.isfile(handleExe):
            raise Exception(f"handleExe requires a valid path to Sysinternals 'handle.exe' or 'handle64.exe' executable. Can be downloaded from following link:\nhttps://learn.microsoft.com/en-us/sysinternals/downloads/handle") 
        if self.stash != None and self.stash.IS_WINDOWS:
            self.ntdll = ctypes.WinDLL('ntdll')
            self.kernel32 = ctypes.WinDLL('kernel32', use_last_error=True)
            # create handle on concerned file with dwDesiredAccess == self.FILE_READ_ATTRIBUTES
            self.kernel32.CreateFileW.restype = wintypes.HANDLE
            self.kernel32.CreateFileW.argtypes = (
                wintypes.LPCWSTR,      # In     lpFileName
                wintypes.DWORD,        # In     dwDesiredAccess
                wintypes.DWORD,        # In     dwShareMode
                self.LPSECURITY_ATTRIBUTES,  # In_opt lpSecurityAttributes
                wintypes.DWORD,        # In     dwCreationDisposition
                wintypes.DWORD,        # In     dwFlagsAndAttributes
                wintypes.HANDLE)       # In_opt hTemplateFile
    
    def getPid(self, path):
        self.lastPath = path
        # ToDo: Add Linux implementation
        if self.stash != None and self.stash.IS_WINDOWS:
            hFile = self.kernel32.CreateFileW(
                path, self.FILE_READ_ATTRIBUTES, self.FILE_SHARE_READ, None, self.OPEN_EXISTING,
                self.FILE_FLAG_BACKUP_SEMANTICS, None)
            if hFile == self.INVALID_HANDLE_VALUE:
                raise ctypes.WinError(ctypes.get_last_error())
            # prepare data types for system call
            class IO_STATUS_BLOCK(ctypes.Structure):
                class _STATUS(ctypes.Union):
                    _fields_ = (('Status', self.NTSTATUS),
                                ('Pointer', wintypes.LPVOID))
                _anonymous_ = '_Status',
                _fields_ = (('_Status', _STATUS),
                            ('Information', self.ULONG_PTR))
            iosb = IO_STATUS_BLOCK()
            class FILE_PROCESS_IDS_USING_FILE_INFORMATION(ctypes.Structure):
                _fields_ = (('NumberOfProcessIdsInList', wintypes.LARGE_INTEGER),
                            ('ProcessIdList', wintypes.LARGE_INTEGER * 64))
            info = FILE_PROCESS_IDS_USING_FILE_INFORMATION()
            PIO_STATUS_BLOCK = ctypes.POINTER(IO_STATUS_BLOCK)
            self.ntdll.NtQueryInformationFile.restype = self.NTSTATUS
            self.ntdll.NtQueryInformationFile.argtypes = (
                wintypes.HANDLE,        # In  FileHandle
                PIO_STATUS_BLOCK,       # Out IoStatusBlock
                wintypes.LPVOID,        # Out FileInformation
                wintypes.ULONG,         # In  Length
                self.FILE_INFORMATION_CLASS)  # In  FileInformationClass
            # system call to retrieve list of PIDs currently using the file
            status = self.ntdll.NtQueryInformationFile(hFile, ctypes.byref(iosb),
                                                  ctypes.byref(info),
                                                  ctypes.sizeof(info),
                                                  self.FileProcessIdsUsingFileInformation)
            pidList = info.ProcessIdList[0:info.NumberOfProcessIdsInList]
            if len(pidList) > 0:
                return pidList
        return None
    
    def isAdmin(self):
        if self.stash != None and self.stash.IS_WINDOWS:
            try:
                return ctypes.windll.shell32.IsUserAnAdmin()
            except:
                return False        
        else:
            return os.getuid() == 0 # For unix like systems
    
    def runMeAsAdmin(self):
        if self.isAdmin() == True:
            return
        if self.stash != None and self.stash.IS_WINDOWS:
            # Below is a Windows only method which does NOT popup a console.
            import win32com.shell.shell as shell # Requires: pip install pywin32
            script = os.path.abspath(sys.argv[0])
            params = ' '.join([script] + sys.argv[1:])
            shell.ShellExecuteEx(lpVerb='runas', lpFile=sys.executable, lpParameters=params)
            sys.exit(0)  
        else:
            from elevate import elevate # Requires: pip install elevate
            elevate()
    
    def getPidExeFileName(self, pid): # Requires running with admin privileges.
        import win32api, win32con, win32process
        handle = win32api.OpenProcess(win32con.PROCESS_ALL_ACCESS, False, pid) #get handle for the pid
        filename = win32process.GetModuleFileNameEx(handle, 0) #get exe path & filename for handle
        return filename
    
    def getFilesOpen(self, pid:int): # Requires running with admin privileges.
        import psutil # Requires: pip install psutil
        p = psutil.Process(pid1)
        return p.open_files()
    
    def getFileHandle(self, pid, path = None): # Requires running with admin privileges.
        if path == None:
            path = self.lastPath
        args = f"{self.handleExe} -p {pid} -nobanner"
        # if self.stash != None: self.stash.Log(args)
        results = os.popen(args).read()
        results = results.splitlines()
        # if self.stash != None: self.stash.Log(results)
        hdls = []
        for line in results:
            # if self.stash != None: self.stash.Log(line)
            if line.endswith(path):
                epos = line.find(":")
                if epos > 0:
                    hdls += [line[0:epos]]
                else:
                    break
        if len(hdls) == 0:
            return None
        return hdls
    
    def closeHandle(self, pid, fileHandle): # Requires running with admin privileges.
        args = f"{self.handleExe} -p {pid} -c {fileHandle} -y -nobanner"
        if self.stash != None: self.stash.Log(args)
        results = os.popen(args).read()
        results = results.strip("\n")
        if results.endswith("Handle closed."):
            return True
        if self.stash != None: self.stash.Error(f"Could not close pid {pid} file handle {fileHandle}; results={results}")
        return False
    
    def closeFile(self, path): # Requires running with admin privileges.
        pids = self.getPid(path)
        if pids == None:
            return None
        # if self.stash != None: self.stash.Log(f"pids={pids}")
        results = []
        
        # Need admin privileges starting here.
        self.runMeAsAdmin()
        for pid in pids:
            hdls = self.getFileHandle(pid, path)
            if hdls == None:
                # if self.stash != None: self.stash.Log(f"No handle for pid {pid}")
                continue
            else:
                for hdl in hdls:
                    # if self.stash != None: self.stash.Log(f"pid {pid} hdl={hdl}")
                    results += [self.closeHandle(pid, hdl)]
        if len(results) == 0:
            return None
        return {"results" : results, "pids" : pids}
