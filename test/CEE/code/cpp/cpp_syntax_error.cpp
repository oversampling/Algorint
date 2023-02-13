#include <iostream>
#include <string>
#include <vector>
using namespace std;

void solve(string str, int strlen, int noOftestCase){
    int counter = 1;
    cout << "Case #" << noOftestCase +1<< ": "
    for (int i = 0; i < strlen - 1; i++){
        cout << counter << " ";
        if (str[i] < str[i+1]){
            counter++;
        }else counter = 1;
    }
    cout << counter << endl;
}

int main(){
    int noOfTestCase, strlengthHold;
    string strHold;
    vector<int> strlength;
    vector<string> str;
    cin >> noOfTestCase;
    cin.ignore();
    for (int i =0 ;i<noOfTestCase; i++){
        cin >> strlengthHold;
        cin.ignore();
        strlength.push_back(strlengthHold);
        cin >> strHold;
        cin.ignore();
        str.push_back(strHold);
        solve(str[i], strlength[i], i);
    }
}
