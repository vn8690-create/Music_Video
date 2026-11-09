import unittest
from pc_bridge import lrc_stamp, rows_to_lrc


class BridgeFormatTest(unittest.TestCase):
    def test_timestamp(self):
        self.assertEqual(lrc_stamp(65.32), "01:05.32")
        self.assertEqual(lrc_stamp(-2), "00:00.00")

    def test_lrc(self):
        self.assertEqual(rows_to_lrc([{"start": 1.5, "text": "Xin chào"}]),
                         "[00:01.50]Xin chào")


if __name__ == "__main__":
    unittest.main()
