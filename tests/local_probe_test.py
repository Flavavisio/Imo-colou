import importlib.util
import json
from pathlib import Path
import subprocess
import unittest
from unittest.mock import patch
spec=importlib.util.spec_from_file_location('probe', 'public/local-connector/vigia-local.py')
m=importlib.util.module_from_spec(spec)
spec.loader.exec_module(m)
class ProbeTests(unittest.TestCase):
    def setUp(self):
        self.config=dict(format='vigia-local-config-v1',cameraId='11111111-1111-4111-8111-111111111111',host='192.168.1.20',port=554,path='/stream')
    def test_reject_public_and_credentials(self):
        for changes in [dict(host='8.8.8.8'),dict(path='/x?password=secret'),dict(port=0)]:
            with self.assertRaises(ValueError): m.validate(self.config|changes)
    def test_success_no_secret_and_cleanup(self):
        paths=[]
        def run(command,**kwargs):
            self.assertNotIn('secret',str(command))
            p=Path(command[command.index('-/i')+1]);paths.append(p)
            self.assertIn('alice:secret@',p.read_text())
            return subprocess.CompletedProcess(command,0,b'{"streams":[{"codec_name":"hevc","width":1920,"height":1080}]}',b'')
        with patch.object(m.subprocess,'run',side_effect=run):
            result=m.probe(self.config,'alice','secret','ffprobe')
        self.assertEqual(result['codec'],'H.265')
        self.assertEqual(result['status'],'stream_found')
        self.assertNotIn('secret',json.dumps(result))
        self.assertFalse(paths[0].exists())
    def test_timeout_and_missing(self):
        with patch.object(m.subprocess,'run',side_effect=subprocess.TimeoutExpired('ffprobe',20)):
            self.assertEqual(m.probe(self.config,'','','ffprobe')['reason'],'timeout')
        with patch.object(m.shutil,'which',return_value=None):
            self.assertEqual(m.probe(self.config,'','')['status'],'tool_missing')
if __name__=='__main__': unittest.main()
