"""
input = ["4 \n57 57 -57 57", "10 \n5 5 5 5 5 5 5 5 5 6"]
test_cases = ["-57", "5"]
"""

if __name__ == '__main__':
    n = int(input())
    arr = map(int, input().split())
    arr = list(set(arr))
    arr.sort()
    print(arr[-2])
