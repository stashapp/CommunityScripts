#! /usr/bin/env python3
#  -*- coding: utf-8 -*-
#
# Support module generated by PAGE version 7.6
#  in conjunction with Tcl version 8.6
#    Jan 07, 2023 02:18:52 AM EST  platform: Windows NT

import tkinter as tk
from tkinter.constants import *

import movieFromSceneGuiDef as myGuiDef

_debug = True # False to eliminate debug printing from callback functions.

def main():
    # '''Main entry point for the application.'''
	global root
	root = tk.Tk()
	root.protocol( 'WM_DELETE_WINDOW' , root.destroy)
	# Creates a toplevel widget.
	global _top1, _w1
	_top1 = root
	_w1 = myGuiDef.Toplevel1(_top1)
	root.mainloop()

# Start the gui from here

if __name__ == '__main__':
	myGuiDef.start_up()





